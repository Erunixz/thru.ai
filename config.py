# config.py
import os

# API Keys - Replace with your actual keys
ANTHROPIC_API_KEY = "your-claude-api-key-here"
ELEVENLABS_API_KEY = "your-elevenlabs-api-key-here"

# Model Settings
WHISPER_MODEL = "base"  # Options: tiny, base, small, medium, large
CLAUDE_MODEL = "claude-haiku-4-5-20251001"  # Fast and cheap for drive-thru
ELEVENLABS_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"  # Rachel voice (default)

# Audio Settings
SAMPLE_RATE = 16000
CHANNELS = 1
RECORDING_DURATION = 5  # seconds to record per turn

# Frontend Settings
FRONTEND_URL = "http://localhost:5000/api/order"