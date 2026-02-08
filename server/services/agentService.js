// =============================================================================
// server/services/agentService.js — ElevenLabs Agent Management
// =============================================================================
//
// Handles communication with the ElevenLabs API to manage the conversational
// AI agent configuration, including updating the system prompt dynamically.
//
// =============================================================================

require('dotenv').config();

const API_KEY = process.env.ELEVENLABS_API_KEY;
const AGENT_ID = process.env.ELEVENLABS_AGENT_ID;

if (!API_KEY) {
  console.error('❌ ELEVENLABS_API_KEY not found in .env');
}

if (!AGENT_ID) {
  console.error('❌ ELEVENLABS_AGENT_ID not found in .env');
  console.error('   Run: node server/setup-agent.js');
}

/**
 * Get the current agent configuration from ElevenLabs
 * @returns {Promise<Object>} - The agent configuration
 */
async function getAgent() {
  if (!API_KEY || !AGENT_ID) {
    throw new Error('Missing ELEVENLABS_API_KEY or ELEVENLABS_AGENT_ID');
  }

  const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, {
    method: 'GET',
    headers: {
      'xi-api-key': API_KEY,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API Error (${response.status}): ${errorText}`);
  }

  return await response.json();
}

/**
 * Update the agent's system prompt
 * @param {string} newPrompt - The new system prompt with updated menu
 * @returns {Promise<Object>} - The updated agent configuration
 */
async function updateAgentPrompt(newPrompt) {
  if (!API_KEY || !AGENT_ID) {
    throw new Error('Missing ELEVENLABS_API_KEY or ELEVENLABS_AGENT_ID');
  }

  const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, {
    method: 'PATCH',
    headers: {
      'xi-api-key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      conversation_config: {
        agent: {
          prompt: {
            prompt: newPrompt,
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API Error (${response.status}): ${errorText}`);
  }

  return await response.json();
}

/**
 * Update the agent's configuration (full config)
 * @param {Object} config - The new configuration object
 * @returns {Promise<Object>} - The updated agent configuration
 */
async function updateAgentConfig(config) {
  if (!API_KEY || !AGENT_ID) {
    throw new Error('Missing ELEVENLABS_API_KEY or ELEVENLABS_AGENT_ID');
  }

  const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, {
    method: 'PATCH',
    headers: {
      'xi-api-key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API Error (${response.status}): ${errorText}`);
  }

  return await response.json();
}

module.exports = {
  getAgent,
  updateAgentPrompt,
  updateAgentConfig,
};
