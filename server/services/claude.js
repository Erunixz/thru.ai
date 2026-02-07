// =============================================================================
// server/services/claude.js — Claude AI Conversation Service
// =============================================================================
//
// PURPOSE:
//   Manages conversation sessions with Anthropic's Claude AI.
//   Each drive-thru customer gets their own session with:
//     - A unique session ID
//     - Full conversation history (so Claude remembers context)
//     - The system prompt (persona + menu + output format rules)
//
// HOW IT WORKS:
//   1. Customer starts a session → we create empty conversation state
//   2. Customer speaks → text is added to history → sent to Claude
//   3. Claude returns <response> (what to say) + <order> (structured JSON)
//   4. We parse both parts and return them separately
//   5. Conversation history grows each turn so Claude has full context
//
// WHY SESSIONS?
//   Claude is stateless — it doesn't remember between API calls.
//   We store the full message history on our server and send it
//   with every request so Claude can reference earlier parts of
//   the conversation ("I also want what I ordered before", etc.)
//
// =============================================================================

const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');
const config = require('../config');

// ---------------------------------------------------------------------------
// Load the restaurant menu — injected into Claude's system prompt
// ---------------------------------------------------------------------------
const menu = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'menu.json'), 'utf-8')
);

// ---------------------------------------------------------------------------
// In-memory session storage
// ---------------------------------------------------------------------------
// Map<sessionId, { history: Message[], order: Object, createdAt: Date }>
// Each session holds the full conversation for one customer interaction.
//
// IN PRODUCTION: Use Redis or a database for persistence across restarts.
const sessions = new Map();

// ---------------------------------------------------------------------------
// System Prompt — The "personality + rules" for the drive-thru AI
// ---------------------------------------------------------------------------
// This is the MOST IMPORTANT part of the AI behaviour. It tells Claude:
//   1. WHO it is (friendly drive-thru assistant)
//   2. WHAT it knows (the full menu with prices, sizes, modifiers)
//   3. HOW to behave (suggest combos, confirm items, be efficient)
//   4. WHAT FORMAT to output (<response> + <order> tags)
//
// The menu JSON is embedded so Claude always knows current prices/items.
// The output format uses XML-like tags for reliable regex parsing.
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `You are a friendly, efficient drive-thru order taker at Burger Express.

MENU:
${JSON.stringify(menu, null, 2)}

INSTRUCTIONS:
- Greet customers warmly when they first arrive
- Take orders accurately, confirming each item
- Ask about size for items that have sizes (fries, drinks)
- Ask about flavor for items that have flavors (milkshakes, sundaes)
- Suggest combos when customers order burger + fries + drink separately (combos save money!)
- Ask about modifications when relevant (no pickles, extra cheese, etc.)
- When order seems complete, repeat the full order back with total price
- Handle special requests politely
- If an item is not on the menu, politely say so and suggest alternatives
- Keep responses brief and natural — this is a drive-thru, be efficient!
- NEVER use markdown formatting, asterisks, or special characters — your text will be spoken aloud
- Use simple, conversational language

OUTPUT FORMAT:
You MUST always respond in this exact format with both tags:

<response>Your conversational response to the customer</response>
<order>
{
  "items": [
    {"name": "item name", "quantity": 1, "price": 0.00, "modifiers": ["modifier1"], "size": "medium"}
  ],
  "total": 0.00,
  "status": "in_progress"
}
</order>

RULES for the order JSON:
- Keep a running total of all items
- "status" must be "in_progress" while ordering
- Set "status" to "complete" ONLY when the customer explicitly confirms they're done
- Include ALL items ordered so far (not just the latest)
- Calculate the total accurately based on menu prices
- If no items ordered yet, use empty items array and total of 0.00
`;

// ---------------------------------------------------------------------------
// Initialize the Anthropic client
// ---------------------------------------------------------------------------
let anthropic = null;
try {
  anthropic = new Anthropic({ apiKey: config.anthropicApiKey });
} catch (err) {
  console.error('❌ Failed to initialize Anthropic client:', err.message);
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Create a new conversation session for a customer.
 *
 * Called when a customer pulls up to the drive-thru and taps "Start Order".
 * Returns a session ID that must be included in all subsequent requests.
 *
 * @param {string} sessionId - Unique session identifier (UUID)
 * @returns {Object} { sessionId, greeting } - The session ID and initial greeting text
 */
function createSession(sessionId) {
  // Store a new session with empty conversation history
  sessions.set(sessionId, {
    history: [],                        // Claude message history [{role, content}, ...]
    order: { items: [], total: 0, status: 'in_progress' },  // Current order state
    createdAt: new Date(),              // When the session started (for kitchen display timing)
  });

  // Hardcoded greeting — no need to waste an API call on this.
  // Claude will pick up the conversation from the customer's first message.
  const greeting = "Welcome to Burger Express! What can I get for you today?";

  return { sessionId, greeting };
}

/**
 * Process a customer's message through Claude AI.
 *
 * This is the core function — called every time the customer speaks.
 * It sends the full conversation history to Claude and parses the response.
 *
 * FLOW:
 *   1. Look up the session's conversation history
 *   2. Append the customer's message
 *   3. Send everything to Claude (system prompt + full history)
 *   4. Parse Claude's response into text (to speak) + order (structured data)
 *   5. Save Claude's response to history for next turn
 *   6. Return { text, order, isComplete }
 *
 * @param {string} sessionId - The session ID from createSession()
 * @param {string} customerText - What the customer said (transcribed speech)
 * @returns {Promise<Object>} { text, order, isComplete }
 */
async function processMessage(sessionId, customerText) {
  // Look up this customer's session
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found. Call /api/session/start first.`);
  }

  if (!anthropic) {
    throw new Error('Anthropic client not initialized. Check ANTHROPIC_API_KEY.');
  }

  // Add the customer's message to conversation history
  session.history.push({
    role: 'user',
    content: customerText,
  });

  // Call Claude API with the full conversation context
  // - model: Haiku (fastest, cheapest — ideal for real-time drive-thru)
  // - max_tokens: 1024 is plenty for a drive-thru response + order JSON
  // - system: System prompt with persona, menu, rules, output format
  // - messages: Full conversation history (all previous turns)
  const response = await anthropic.messages.create({
    model: config.claudeModel,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: session.history,
  });

  // Extract the raw text from Claude's response
  const aiResponse = response.content[0].text;

  // Save Claude's response to history (so next turn has full context)
  session.history.push({
    role: 'assistant',
    content: aiResponse,
  });

  // --- Parse the structured response ---
  // Claude outputs: <response>text to speak</response><order>JSON</order>
  // We extract both using regex.

  // Extract conversational reply (what to say to the customer)
  const responseMatch = aiResponse.match(/<response>([\s\S]*?)<\/response>/);
  const text = responseMatch
    ? responseMatch[1].trim()
    : "Sorry, could you repeat that?";  // Fallback if parsing fails

  // Extract order JSON (current state of the order)
  const orderMatch = aiResponse.match(/<order>([\s\S]*?)<\/order>/);
  if (orderMatch) {
    try {
      session.order = JSON.parse(orderMatch[1]);
    } catch (err) {
      // If Claude's JSON is malformed, keep the previous order state.
      // This is a safety net — Claude usually formats correctly.
      console.warn('⚠️  Failed to parse order JSON from Claude:', err.message);
    }
  }

  // Check if the order is complete (customer confirmed "that's all")
  const isComplete = session.order.status === 'complete';

  return {
    text,                    // What to speak back to the customer
    order: session.order,    // Current order state (items, total, status)
    isComplete,              // True when customer confirmed order is done
  };
}

/**
 * Get a session's current state.
 *
 * @param {string} sessionId
 * @returns {Object|null} The session object or null if not found
 */
function getSession(sessionId) {
  return sessions.get(sessionId) || null;
}

/**
 * Get all active sessions (for debugging / admin).
 *
 * @returns {Array} Array of { sessionId, order, createdAt }
 */
function getAllSessions() {
  const result = [];
  for (const [id, session] of sessions) {
    result.push({
      sessionId: id,
      order: session.order,
      createdAt: session.createdAt,
    });
  }
  return result;
}

/**
 * Delete a session (cleanup after order is done).
 *
 * @param {string} sessionId
 */
function deleteSession(sessionId) {
  sessions.delete(sessionId);
}

module.exports = {
  createSession,
  processMessage,
  getSession,
  getAllSessions,
  deleteSession,
};
