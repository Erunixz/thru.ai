# =============================================================================
# config.py — Central Configuration for thru.ai Drive-Through AI System
# =============================================================================
#
# PURPOSE:
#   This file holds every tunable setting for the entire system in one place.
#   Swap API keys, change models, adjust audio quality — all from here.
#   No "magic numbers" should live anywhere else in the codebase.
#
# HOW IT FITS IN THE ARCHITECTURE:
#   main.py imports this →  uses keys/settings to initialise Whisper, Claude, ElevenLabs
#   frontend_server.py →  uses FRONTEND_URL to know where to POST order updates
#
# SECURITY NOTE:
#   In production, load secrets from environment variables or a .env file,
#   NEVER hard-code real API keys in source code committed to git.
# =============================================================================

import os

# -----------------------------------------------------------------------------
# API KEYS — Replace with your real keys (or load from env vars)
# -----------------------------------------------------------------------------
# Anthropic Claude — powers the conversational AI that understands orders
#   Get yours at: https://console.anthropic.com/
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "your-claude-api-key-here")

# ElevenLabs — converts the AI's text replies into natural human-sounding speech
#   Get yours at: https://elevenlabs.io/
ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY", "your-elevenlabs-api-key-here")

# -----------------------------------------------------------------------------
# MODEL SETTINGS — Choose which AI models to use at each stage
# -----------------------------------------------------------------------------
# Whisper (Speech-to-Text) — runs LOCALLY on GPU via faster-whisper
#   Options: "tiny" (fastest, least accurate)
#            "base" (good balance for drive-thru — our default)
#            "small" / "medium" / "large" (progressively more accurate but slower)
#   The model is downloaded once and cached by faster-whisper.
WHISPER_MODEL = "base"

# Claude (Conversation & Order Extraction)
#   "claude-haiku-4-5-20251001" is the fastest + cheapest Claude model.
#   Perfect for drive-thru: low latency responses, still highly capable.
#   Alternatives: "claude-sonnet-4-20250514" (smarter but slower)
CLAUDE_MODEL = "claude-haiku-4-5-20251001"

# ElevenLabs Voice (Text-to-Speech)
#   Each voice has a unique ID. "21m00Tcm4TlvDq8ikWAM" = "Rachel" (default).
#   Browse voices: https://elevenlabs.io/voice-library
#   For multilingual support, you can map different voice IDs per language.
ELEVENLABS_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"

# -----------------------------------------------------------------------------
# AUDIO SETTINGS — How we capture the customer's voice
# -----------------------------------------------------------------------------
# Sample rate in Hz. 16 000 Hz (16 kHz) is Whisper's native rate.
#   Higher = better quality but larger files and slower transcription.
#   16 kHz is the sweet spot for speech recognition.
SAMPLE_RATE = 16000

# Mono (1 channel) is all we need for speech recognition.
#   Stereo (2 channels) would double the data with no benefit here.
CHANNELS = 1

# How many seconds to record per customer turn.
#   5 seconds works for short orders ("I'll have a cheeseburger").
#   Increase to 8-10 if customers give longer, compound orders.
RECORDING_DURATION = 5

# -----------------------------------------------------------------------------
# FRONTEND / KITCHEN DISPLAY SETTINGS
# -----------------------------------------------------------------------------
# The URL where the Flask frontend_server.py listens for order updates.
#   main.py POSTs the current order JSON here after every AI turn.
#   This keeps the kitchen display in sync in real-time.
FRONTEND_URL = "http://localhost:5000/api/order"
