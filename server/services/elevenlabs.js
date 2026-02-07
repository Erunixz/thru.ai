// =============================================================================
// server/services/elevenlabs.js — ElevenLabs Text-to-Speech Service
// =============================================================================
//
// PURPOSE:
//   Converts text into natural human speech using the ElevenLabs API.
//   This is what makes the drive-thru AI SOUND like a real person.
//
// HOW IT WORKS:
//   1. Receive text (Claude's response to the customer)
//   2. POST the text to ElevenLabs TTS API
//   3. Receive audio data (MP3 format)
//   4. Convert to base64 string
//   5. Return base64 to the frontend, which plays it through speakers
//
// WHY ELEVENLABS?
//   - Most natural-sounding AI voices on the market
//   - "eleven_turbo_v2_5" model is optimised for low-latency (< 1 second)
//   - Supports 29+ languages for multilingual drive-thru
//   - Key differentiator for hackathon (ElevenLabs is a sponsor)
//
// WHY BASE64?
//   For a hackathon, returning audio as base64 in the JSON response is the
//   simplest approach. The frontend decodes it and plays it via the Audio API.
//   For production, you'd stream the audio chunks for faster time-to-first-byte.
//
// =============================================================================

const config = require('../config');

// ---------------------------------------------------------------------------
// ElevenLabs API Configuration
// ---------------------------------------------------------------------------
const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';

/**
 * Convert text to speech using ElevenLabs and return base64 audio.
 *
 * FLOW:
 *   1. Send text + voice settings to ElevenLabs TTS endpoint
 *   2. Receive MP3 audio as binary response
 *   3. Convert binary to base64 string
 *   4. Return the base64 string (frontend will decode and play it)
 *
 * @param {string} text - The text to convert to speech
 * @param {Object} [options] - Optional overrides
 * @param {string} [options.voiceId] - Override the default voice
 * @param {string} [options.modelId] - Override the TTS model
 * @returns {Promise<string>} Base64-encoded MP3 audio data
 */
async function textToSpeech(text, options = {}) {
  // Validate that we have an API key
  if (!config.elevenLabsApiKey) {
    throw new Error(
      'ELEVENLABS_API_KEY is not set. Add it to your .env file.'
    );
  }

  // Use provided overrides or fall back to config defaults
  const voiceId = options.voiceId || config.elevenLabsVoiceId;
  const modelId = options.modelId || config.elevenLabsModel;

  // Build the API URL
  // Endpoint: POST /v1/text-to-speech/{voice_id}
  const url = `${ELEVENLABS_API_BASE}/text-to-speech/${voiceId}`;

  // Call the ElevenLabs TTS API
  // - text: the string to speak
  // - model_id: which TTS model to use
  // - voice_settings: fine-tune the voice characteristics
  //   - stability: 0-1, higher = more consistent but less expressive
  //   - similarity_boost: 0-1, higher = closer to original voice
  //   - style: 0-1, amount of style emphasis (turbo models support this)
  //   - use_speaker_boost: enhances voice clarity (recommended for drive-thru)
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': config.elevenLabsApiKey,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',  // Request MP3 format
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: {
        stability: 0.5,          // Balanced between consistency and expressiveness
        similarity_boost: 0.75,  // Stay close to the original voice
        style: 0.0,              // Minimal style exaggeration (natural for drive-thru)
        use_speaker_boost: true,  // Enhance clarity (important for outdoor speakers)
      },
    }),
  });

  // Handle API errors
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `ElevenLabs API error (${response.status}): ${errorText}`
    );
  }

  // Convert the binary audio response to a base64 string
  // The frontend will decode this and play it via the browser's Audio API.
  const audioBuffer = await response.arrayBuffer();
  const base64Audio = Buffer.from(audioBuffer).toString('base64');

  return base64Audio;
}

/**
 * Get a list of available voices from ElevenLabs.
 *
 * Useful for:
 *   - Letting users pick a voice
 *   - Finding voice IDs for different languages
 *   - Validating that the configured voice ID exists
 *
 * @returns {Promise<Array>} Array of voice objects from ElevenLabs
 */
async function getAvailableVoices() {
  if (!config.elevenLabsApiKey) {
    throw new Error('ELEVENLABS_API_KEY is not set.');
  }

  const response = await fetch(`${ELEVENLABS_API_BASE}/voices`, {
    headers: {
      'xi-api-key': config.elevenLabsApiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs API error (${response.status})`);
  }

  const data = await response.json();
  return data.voices;
}

module.exports = {
  textToSpeech,
  getAvailableVoices,
};
