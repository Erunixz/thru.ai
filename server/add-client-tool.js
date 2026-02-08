#!/usr/bin/env node
// =============================================================================
// server/add-client-tool.js — Add update_order Client Tool to Agent
// =============================================================================
//
// Run ONCE:  node server/add-client-tool.js
//
// Adds the update_order client tool to the ElevenLabs agent via API.
// This tool allows the agent to update the order in real-time.
//
// =============================================================================

require('dotenv').config();

const API_KEY = process.env.ELEVENLABS_API_KEY;
const AGENT_ID = process.env.ELEVENLABS_AGENT_ID;

if (!API_KEY) {
  console.error('❌ ELEVENLABS_API_KEY not found in .env');
  process.exit(1);
}

if (!AGENT_ID) {
  console.error('❌ ELEVENLABS_AGENT_ID not found in .env');
  console.error('   Run: node server/setup-agent.js first');
  process.exit(1);
}

async function addClientTool() {
  console.log('');
  console.log('🔧 Adding update_order client tool to agent...');
  console.log('');

  try {
    // First, get the current agent configuration
    const getResponse = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, {
      method: 'GET',
      headers: {
        'xi-api-key': API_KEY,
      },
    });

    if (!getResponse.ok) {
      const errorText = await getResponse.text();
      throw new Error(`Failed to get agent: ${getResponse.status} - ${errorText}`);
    }

    const agentData = await getResponse.json();
    console.log('✓ Retrieved current agent configuration');

    // Prepare the client tool configuration
    const clientTool = {
      type: 'client',
      name: 'update_order',
      description: 'Update the customer order. Call EVERY TIME items change. Use status "complete" when confirmed.',
      parameters_schema: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            description: 'All items in the order',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Item name' },
                quantity: { type: 'number', description: 'Quantity' },
                price: { type: 'number', description: 'Price per item' },
                size: { type: 'string', description: 'Size (if applicable)' },
                modifiers: {
                  type: 'array',
                  description: 'Modifiers like "no pickles", "extra cheese"',
                  items: { type: 'string' }
                }
              },
              required: ['name', 'quantity', 'price']
            }
          },
          total: {
            type: 'number',
            description: 'Total price'
          },
          status: {
            type: 'string',
            description: '"in_progress" or "complete"',
            enum: ['in_progress', 'complete']
          }
        },
        required: ['items', 'total', 'status']
      }
    };

    // Get existing tools or initialize empty array
    const existingTools = agentData.conversation_config?.agent?.tools || [];

    // Check if update_order already exists
    const hasUpdateOrder = existingTools.some(tool => tool.name === 'update_order');

    if (hasUpdateOrder) {
      console.log('⚠️  update_order tool already exists. Updating it...');
      // Remove existing update_order and add new one
      const filteredTools = existingTools.filter(tool => tool.name !== 'update_order');
      filteredTools.push(clientTool);
      agentData.conversation_config.agent.tools = filteredTools;
    } else {
      console.log('➕ Adding update_order tool...');
      existingTools.push(clientTool);
      agentData.conversation_config.agent.tools = existingTools;
    }

    // Update the agent with the new tool
    const updateResponse = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, {
      method: 'PATCH',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_config: agentData.conversation_config
      }),
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Failed to update agent: ${updateResponse.status} - ${errorText}`);
    }

    console.log('');
    console.log('✅ Successfully added update_order client tool!');
    console.log('');
    console.log('='.repeat(58));
    console.log('  Next Steps:');
    console.log('='.repeat(58));
    console.log('');
    console.log('  1. Restart your dev server if it\'s running:');
    console.log('     npm run dev');
    console.log('');
    console.log('  2. Open: http://localhost:5173');
    console.log('');
    console.log('  3. Start a new order and say something like:');
    console.log('     "I\'d like a Bacon BBQ Burger and large fries"');
    console.log('');
    console.log('  4. Watch the "Your Order" panel on the right!');
    console.log('     Items should now appear in real-time.');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('');
    console.log('If the API call failed, you may need to add the tool manually:');
    console.log('1. Go to: https://elevenlabs.io/app/conversational-ai');
    console.log('2. Click on "Burger Express Drive-Thru"');
    console.log('3. Go to Tools → Add Tool → Client');
    console.log('4. Configure as described in the README');
    console.log('');
    process.exit(1);
  }
}

addClientTool();
