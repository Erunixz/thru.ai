#!/usr/bin/env node
// Check what tools are configured on the agent

require('dotenv').config();

const API_KEY = process.env.ELEVENLABS_API_KEY;
const AGENT_ID = process.env.ELEVENLABS_AGENT_ID;

async function checkTools() {
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, {
      method: 'GET',
      headers: {
        'xi-api-key': API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const agentData = await response.json();
    const tools = agentData.conversation_config?.agent?.tools || [];

    console.log('\n📋 Agent Tools Configuration:');
    console.log('='.repeat(58));

    if (tools.length === 0) {
      console.log('❌ NO TOOLS CONFIGURED!');
      console.log('\nThe agent has no tools. The update_order tool was not added.');
    } else {
      console.log(`✅ Found ${tools.length} tool(s):\n`);
      tools.forEach((tool, index) => {
        console.log(`${index + 1}. ${tool.name} (${tool.type})`);
        console.log(`   Description: ${tool.description || 'N/A'}`);
        if (tool.parameters) {
          const params = Object.keys(tool.parameters.properties || {});
          console.log(`   Parameters: ${params.join(', ')}`);
        }
        console.log('');
      });
    }

    console.log('='.repeat(58));
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTools();
