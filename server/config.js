// =============================================================================
// server/config.js — Central Configuration
// =============================================================================
//
// Custom LLM architecture using:
//   - GEMINI_API_KEY: For conversation AI (Google Gemini)
//   - ELEVENLABS_API_KEY: For text-to-speech only
//
// =============================================================================

require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Google Gemini (LLM for conversations)
  geminiApiKey: process.env.GEMINI_API_KEY,

  // ElevenLabs (TTS only)
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY,
  elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB', // Adam voice
};

// Validation warnings
if (!config.geminiApiKey) {
  console.warn('⚠️  GEMINI_API_KEY is not set. Get one at https://aistudio.google.com/app/apikey');
}
if (!config.elevenLabsApiKey) {
  console.warn('⚠️  ELEVENLABS_API_KEY is not set. TTS will not work.');
}

module.exports = config;
