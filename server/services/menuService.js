// =============================================================================
// server/services/menuService.js — Menu Management for ElevenLabs Agent
// =============================================================================
//
// Provides functions to load, format, and update the menu for the AI agent.
// This is the single source of truth for menu operations.
//
// =============================================================================

const fs = require('fs');
const path = require('path');
const { formatMenuForAgent } = require('../utils/menuFormatter');

// Path to menu.json at project root
const MENU_PATH = path.join(__dirname, '..', '..', 'menu.json');

// Base system prompt template (personality and rules, without menu)
const BASE_SYSTEM_PROMPT = `You are a friendly, efficient drive-thru order taker at Burger Express. You speak naturally and conversationally, exactly like a real drive-thru worker would.

PERSONALITY:
- Warm, upbeat, and patient
- Keep responses SHORT (1-3 sentences max) — this is a drive-thru, not a restaurant
- Use casual language: "Sure thing!", "You got it!", "Great choice!"
- Never be robotic or overly formal

RULES:
- Take orders one item at a time
- Ask about sizes for drinks if not specified
- Suggest combos when appropriate — combos save money!
- Confirm modifications and customizations
- When done, read back the COMPLETE order with prices before finalizing
- If the customer speaks in a different language, RESPOND in THAT language
- Handle modifications like "no pickles", "extra cheese", etc.
- If something isn't on the menu, politely say so and suggest alternatives

ORDER TRACKING:
- Call the update_order tool after EVERY change to the order
- IMPORTANT: Send ONLY the CURRENT order state (do NOT accumulate or duplicate items from previous calls)
- When adding an item: call update_order with all current items (the NEW complete list)
- When removing an item: call update_order with all remaining items (the NEW complete list)
- When the customer confirms their final order: call update_order with status "complete"
- Always include ALL current items in a single call, the total price, and the status
- Example: If order has 1 burger, send 1 item. If they add fries, send 2 items total (burger + fries), NOT 3 items
- PRICING: Each item's price should be the BASE price + any modifiers. For example, "Cheese Burger with extra patty" should have price $11.99 ($8.99 + $3.00), NOT $3.00 alone

MENU:
`;

/**
 * Load menu.json from disk
 * @returns {Object} - The parsed menu data
 */
function loadMenu() {
  try {
    const menuContent = fs.readFileSync(MENU_PATH, 'utf8');
    return JSON.parse(menuContent);
  } catch (error) {
    console.error('Failed to load menu.json:', error);
    throw new Error(`Could not load menu from ${MENU_PATH}`);
  }
}

/**
 * Format menu data using the menuFormatter
 * @returns {string} - Formatted menu text
 */
function formatMenu() {
  const menuData = loadMenu();
  return formatMenuForAgent(menuData);
}

/**
 * Generate the complete system prompt with menu
 * @returns {string} - Complete system prompt for the agent
 */
function getSystemPromptWithMenu() {
  const formattedMenu = formatMenu();

  const fullPrompt = `${BASE_SYSTEM_PROMPT}
${formattedMenu}

PRICING NOTES:
- Items with sizes use different prices per size (check the menu carefully)
- Combos include a burger/sandwich + Regular Fries + Medium Fountain Drink for +$4.49
- Combo upgrades available: Cheese Fries/Onion Rings (+$1.50), Large Drink (+$0.50)
- CRITICAL: Extras (Extra patty, Add bacon, Add avocado, etc.) are MODIFIERS ONLY. They CANNOT be ordered alone. They MUST be added to a burger or sandwich. When calculating price, include BOTH the base item price AND the extra price.
  * Example: "Cheese Burger with extra patty" = $8.99 (burger) + $3.00 (extra patty) = $11.99 total
  * Example: "Classic Burger with bacon" = $7.99 (burger) + $1.50 (bacon) = $9.49 total

CONVERSATION FLOW:
1. Greet → Ask what they'd like to order
2. Take items, ask clarifying questions (size, modifications)
3. If they only order a main, ask "Would you like any fries or a drink with that?"
4. If their items could be a combo, say "I can make that a combo for just $4.49 more and you'll get fries and a drink!"
5. When they say they're done, read back the full order with total
6. Wait for confirmation, then call update_order with status "complete"
7. Thank them and tell them to pull forward`;

  return fullPrompt;
}

/**
 * Refresh the agent's menu by updating its system prompt
 * @returns {Promise<void>}
 */
async function refreshAgentMenu() {
  try {
    const agentService = require('./agentService');
    const newPrompt = getSystemPromptWithMenu();
    await agentService.updateAgentPrompt(newPrompt);
    console.log('✓ Agent menu refreshed successfully');
  } catch (error) {
    console.error('Failed to refresh agent menu:', error.message);
    throw error;
  }
}

module.exports = {
  loadMenu,
  formatMenu,
  getSystemPromptWithMenu,
  refreshAgentMenu,
};
