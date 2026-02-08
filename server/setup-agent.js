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
const menuService = require('./services/menuService');

const API_KEY = process.env.ELEVENLABS_API_KEY;

if (!API_KEY) {
  console.error('❌ ELEVENLABS_API_KEY not found in .env');
  process.exit(1);
}

// Get system prompt with menu from menuService
const SYSTEM_PROMPT = menuService.getSystemPromptWithMenu();
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
