// =============================================================================
// server/config.js — Central Configuration for the Node.js Backend
// =============================================================================
//
// PURPOSE:
//   Loads environment variables from .env and exports a single config object
//   used by all server modules. Every tunable setting lives here.
//
// USAGE:
//   const config = require('./config');
//   console.log(config.port); // 3001
//
// =============================================================================

// Load .env file from the project root (one level up from /server)
require('dotenv').config();

const config = {
  // ---------------------------------------------------------------------------
  // Server Settings
  // ---------------------------------------------------------------------------
  port: parseInt(process.env.PORT, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',

  // ---------------------------------------------------------------------------
  // Anthropic Claude — Conversational AI
  // ---------------------------------------------------------------------------
  // The API key authenticates requests to Anthropic's Claude API.
  // Claude processes customer speech, extracts order data, and generates replies.
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,

  // Claude model name. Haiku = fastest/cheapest. Perfect for real-time drive-thru.
  claudeModel: process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001',

  // ---------------------------------------------------------------------------
  // ElevenLabs — Text-to-Speech
  // ---------------------------------------------------------------------------
  // The API key authenticates requests to ElevenLabs' TTS API.
  // ElevenLabs converts Claude's text replies into natural human speech.
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY,

  // Voice ID determines which voice speaks. Default = "Rachel" (warm, clear).
  // For multilingual: map different voice IDs per language.
  elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM',

  // TTS model. "eleven_turbo_v2_5" is optimised for low-latency streaming.
  elevenLabsModel: process.env.ELEVENLABS_MODEL || 'eleven_turbo_v2_5',
};

// ---------------------------------------------------------------------------
// Validation — Warn if required keys are missing
// ---------------------------------------------------------------------------
// We warn instead of crashing so the app can still start for UI development
// without API keys configured. API calls will fail at runtime with clear errors.
if (!config.anthropicApiKey) {
  console.warn('⚠️  ANTHROPIC_API_KEY is not set. Claude AI will not work.');
}
if (!config.elevenLabsApiKey) {
  console.warn('⚠️  ELEVENLABS_API_KEY is not set. Text-to-speech will not work.');
}

module.exports = config;
