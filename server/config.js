// =============================================================================
// server/config.js — Central Configuration
// =============================================================================
//
// Simplified for the ElevenLabs Conversational AI Agent architecture.
// The agent handles STT, LLM, and TTS — we just need:
//   - ELEVENLABS_API_KEY (to generate signed URLs)
//   - ELEVENLABS_AGENT_ID (the agent created via setup-agent.js or dashboard)
//
// =============================================================================

require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',

  // ElevenLabs Conversational AI Agent
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY,
  elevenLabsAgentId: process.env.ELEVENLABS_AGENT_ID,
};

// Validation warnings
if (!config.elevenLabsApiKey) {
  console.warn('⚠️  ELEVENLABS_API_KEY is not set. Agent sessions will not work.');
}
if (!config.elevenLabsAgentId) {
  console.warn('⚠️  ELEVENLABS_AGENT_ID is not set. Create an agent at https://elevenlabs.io/app/conversational-ai');
}

module.exports = config;
