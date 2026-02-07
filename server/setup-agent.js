#!/usr/bin/env node
// =============================================================================
// server/setup-agent.js — Create the ElevenLabs Conversational AI Agent
// =============================================================================
//
// Run ONCE:  node server/setup-agent.js
//
// Creates a Burger Express drive-thru agent via the ElevenLabs API,
// configures it with the menu + personality, and saves the agent ID to .env.
//
// If the API call fails (permissions issue), it prints manual instructions.
//
// =============================================================================

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.ELEVENLABS_API_KEY;

if (!API_KEY) {
  console.error('❌ ELEVENLABS_API_KEY not found in .env');
  process.exit(1);
}

const menu = require('./menu.json');
const menuText = JSON.stringify(menu, null, 2);

// System prompt — "trains" the agent for drive-thru context
const SYSTEM_PROMPT = `You are a friendly, efficient drive-thru order taker at Burger Express. You speak naturally and conversationally, exactly like a real drive-thru worker would.

PERSONALITY:
- Warm, upbeat, and patient
- Keep responses SHORT (1-3 sentences max) — this is a drive-thru, not a restaurant
- Use casual language: "Sure thing!", "You got it!", "Great choice!"
- Never be robotic or overly formal

RULES:
- Take orders one item at a time
- Ask about sizes for drinks and fries (small/medium/large) if not specified
- Suggest combos when a customer orders items that match a combo deal
- Confirm modifications and customizations
- When done, read back the COMPLETE order with prices before finalizing
- If the customer speaks in a different language, RESPOND in THAT language
- Handle modifications like "no pickles", "extra cheese", etc.
- If something isn't on the menu, politely say so and suggest alternatives

ORDER TRACKING:
- Call the update_order tool after EVERY change to the order
- When adding an item: call update_order with the full updated order
- When removing an item: call update_order with the updated order
- When the customer confirms their final order: call update_order with status "complete"
- Always include ALL current items, the total price, and the status

MENU:
${menuText}

PRICING NOTES:
- Items with sizes use size_prices (e.g., Medium Fries = $3.49, Large Coke = $2.59)
- If no size is specified for sized items, ask the customer
- Combos are discounted meal deals — suggest them to save money!

CONVERSATION FLOW:
1. Greet → Ask what they'd like to order
2. Take items, ask clarifying questions (size, modifications)
3. If they only order a main, ask "Would you like any fries or a drink with that?"
4. If their items match a combo, say "I can make that Combo #X for $X.XX and save you $X!"
5. When they say they're done, read back the full order with total
6. Wait for confirmation, then call update_order with status "complete"
7. Thank them and tell them to pull forward`;

const FIRST_MESSAGE = "Welcome to Burger Express! What can I get for you today?";

async function createAgent() {
  console.log('');
  console.log('🍔 Creating Burger Express Drive-Thru Agent...');
  console.log('');

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/convai/agents/create', {
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Burger Express Drive-Thru',
        conversation_config: {
          agent: {
            prompt: { prompt: SYSTEM_PROMPT },
            first_message: FIRST_MESSAGE,
            language: 'en',
          },
          tts: {
            voice_id: process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM',
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ ElevenLabs API Error (${response.status}):`);
      console.error(errorText);
      console.log('');
      printManualInstructions();
      process.exit(1);
    }

    const data = await response.json();
    const agentId = data.agent_id;

    console.log(`✅ Agent created! ID: ${agentId}`);
    console.log('');

    // Save to .env
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

    if (envContent.includes('ELEVENLABS_AGENT_ID=')) {
      envContent = envContent.replace(/ELEVENLABS_AGENT_ID=.*/, `ELEVENLABS_AGENT_ID=${agentId}`);
    } else {
      envContent += `\nELEVENLABS_AGENT_ID=${agentId}\n`;
    }

    fs.writeFileSync(envPath, envContent);
    console.log('📝 Agent ID saved to .env');
    console.log('');
    printClientToolInstructions();

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('');
    printManualInstructions();
    process.exit(1);
  }
}

function printClientToolInstructions() {
  console.log('='.repeat(58));
  console.log('  ⚠️  IMPORTANT: Add the "update_order" Client Tool');
  console.log('='.repeat(58));
  console.log('');
  console.log('  1. Open: https://elevenlabs.io/app/conversational-ai');
  console.log('  2. Click on "Burger Express Drive-Thru"');
  console.log('  3. Go to Tools → Add Tool → Client');
  console.log('  4. Name: update_order');
  console.log('  5. Description: Update the customer order. Call EVERY');
  console.log('     TIME items change. Use status "complete" when confirmed.');
  console.log('  6. Parameters:');
  console.log('     - items (Array, required): All items in the order');
  console.log('     - total (Number, required): Total price');
  console.log('     - status (String, required): "in_progress" or "complete"');
  console.log('  7. Save the agent');
  console.log('');
  console.log('  ✅ Then run: npm run dev');
  console.log('');
}

function printManualInstructions() {
  console.log('='.repeat(58));
  console.log('  📋 Manual Setup (API key may lack permissions)');
  console.log('='.repeat(58));
  console.log('');
  console.log('  Your API key needs "Conversational AI" permission.');
  console.log('  Either regenerate the key with that permission, or:');
  console.log('');
  console.log('  1. Go to: https://elevenlabs.io/app/conversational-ai');
  console.log('  2. Click "Create Agent"');
  console.log('  3. Name: "Burger Express Drive-Thru"');
  console.log('  4. Paste the system prompt (see server/setup-agent.js)');
  console.log('  5. First Message: "Welcome to Burger Express!');
  console.log('     What can I get for you today?"');
  console.log('  6. Add the "update_order" client tool (see above)');
  console.log('  7. Save → Copy the Agent ID');
  console.log('  8. Add to .env: ELEVENLABS_AGENT_ID=your-agent-id');
  console.log('');
  console.log('  Then run: npm run dev');
  console.log('');
}

createAgent();
