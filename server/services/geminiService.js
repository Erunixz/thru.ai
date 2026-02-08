// =============================================================================
// server/services/geminiService.js — Google Gemini Conversation Handler
// =============================================================================

const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');
const menu = require('../menu.json');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(config.geminiApiKey);

// Format menu for Gemini context
function formatMenuForAI() {
  let menuText = "BURGER EXPRESS MENU:\n\n";

  Object.entries(menu).forEach(([category, items]) => {
    menuText += `${category.toUpperCase()}:\n`;
    Object.entries(items).forEach(([name, data]) => {
      menuText += `  - ${name}: $${data.price}`;

      if (data.sizes && data.size_prices) {
        const sizes = Object.entries(data.size_prices)
          .map(([size, price]) => `${size} $${price}`)
          .join(', ');
        menuText += ` (Sizes: ${sizes})`;
      }

      if (data.modifiers && data.modifiers.length > 0) {
        menuText += ` [Modifiers: ${data.modifiers.join(', ')}]`;
      }

      if (data.flavors && data.flavors.length > 0) {
        menuText += ` [Flavors: ${data.flavors.join(', ')}]`;
      }

      if (data.description) {
        menuText += ` - ${data.description}`;
      }

      menuText += '\n';
    });
    menuText += '\n';
  });

  return menuText;
}

// System prompt for the AI
const SYSTEM_PROMPT = `You are a friendly AI assistant for Burger Express, a drive-through restaurant. Your job is to help customers place orders.

${formatMenuForAI()}

CRITICAL INSTRUCTIONS:
1. Greet customers warmly and ask what they'd like
2. Listen carefully to their order
3. For EVERY item mentioned, look up the EXACT price from the menu above
4. Keep track of their complete order with prices
5. After each item, confirm what you added and the price
6. Ask if they want anything else
7. When they say they're done, give them the total

RESPONSE FORMAT:
You MUST respond with a JSON object containing:
{
  "message": "What you say to the customer",
  "order": {
    "items": [
      {"name": "Item Name", "price": 6.49, "quantity": 1, "size": "medium", "modifiers": ["no pickles"]}
    ],
    "total": 9.98,
    "status": "in_progress" or "complete"
  }
}

PRICING RULES:
- ALWAYS use exact prices from the menu above
- For sized items, use the size-specific price
- Multiply price by quantity
- Sum all items for the total
- NEVER guess or make up prices

EXAMPLE:
Customer: "I want a cheeseburger and medium fries"
You respond with JSON:
{
  "message": "Great! I've added a Cheeseburger for $6.49 and Medium Fries for $3.49. Your total so far is $9.98. Would you like anything else?",
  "order": {
    "items": [
      {"name": "Cheeseburger", "price": 6.49, "quantity": 1},
      {"name": "Fries", "price": 3.49, "quantity": 1, "size": "medium"}
    ],
    "total": 9.98,
    "status": "in_progress"
  }
}

When customer says "that's all" or "no thanks", set status to "complete".

IMPORTANT: Your entire response must be valid JSON. Do not include any text outside the JSON object.`;

// Store active conversations (in production, use Redis or similar)
const conversations = new Map();

async function handleMessage(orderId, userMessage, isFirstMessage = false) {
  try {
    // Get or create conversation
    let chat = conversations.get(orderId);

    if (!chat || isFirstMessage) {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 1024,
        },
      });

      chat = model.startChat({
        history: [
          {
            role: 'user',
            parts: [{ text: 'Initialize with system prompt' }],
          },
          {
            role: 'model',
            parts: [{ text: SYSTEM_PROMPT }],
          },
        ],
      });

      conversations.set(orderId, chat);
    }

    // Send user message
    const result = await chat.sendMessage(userMessage);
    const responseText = result.response.text();

    // Parse JSON response
    let parsedResponse;
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', responseText);
      // Fallback response
      parsedResponse = {
        message: responseText,
        order: null
      };
    }

    return parsedResponse;

  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

function clearConversation(orderId) {
  conversations.delete(orderId);
}

module.exports = {
  handleMessage,
  clearConversation,
  formatMenuForAI
};
