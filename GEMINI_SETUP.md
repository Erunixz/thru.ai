# Gemini LLM Setup Guide

Your drive-thru now uses **Google Gemini** as the conversation AI! Here's how to set it up:

## Architecture

```
Customer speaks → Web Speech API (STT) → Backend → Gemini LLM → ElevenLabs (TTS) → Customer hears
```

- **Speech-to-Text**: Web Speech API (built into Chrome, free)
- **LLM**: Google Gemini 1.5 Flash (your own API)
- **Text-to-Speech**: ElevenLabs API
- **Menu Integration**: menu.json loaded directly into Gemini context

---

## Setup Steps

### 1. Get Gemini API Key

1. Go to: https://aistudio.google.com/app/apikey
2. Click **"Create API Key"**
3. Copy the key (starts with `AIza...`)

### 2. Add to Server .env

Edit `/Users/emre/thru.ai/server/.env`:

```bash
# Google Gemini (required for conversation AI)
GEMINI_API_KEY=AIzaSy...your-key-here

# ElevenLabs (required for text-to-speech)
ELEVENLABS_API_KEY=your-elevenlabs-key
```

### 3. Add to Client .env

Edit `/Users/emre/thru.ai/client/.env`:

```bash
# ElevenLabs API Key (for TTS in browser)
VITE_ELEVENLABS_API_KEY=your-elevenlabs-key
```

### 4. Restart Servers

```bash
# Terminal 1
cd server && npm start

# Terminal 2
cd client && npm run dev
```

---

## How It Works

1. **Customer clicks "Start Order"**
   - Web Speech API starts listening
   - Sends "Hello" to Gemini

2. **Gemini responds** with greeting
   - Has full menu.json in context
   - Knows all prices, modifiers, sizes

3. **Customer speaks** (e.g., "I want a cheeseburger")
   - Speech → Text via Web Speech API
   - Text sent to `/api/chat` endpoint
   - Gemini processes with menu context

4. **Gemini responds with JSON:**
   ```json
   {
     "message": "Great! I've added a Cheeseburger for $6.49...",
     "order": {
       "items": [{"name": "Cheeseburger", "price": 6.49, "quantity": 1}],
       "total": 6.49,
       "status": "in_progress"
     }
   }
   ```

5. **Response spoken** via ElevenLabs TTS

6. **Order panel updates** in real-time

---

## Testing

1. Go to **http://localhost:5175/**
2. Click "Start Order"
3. Allow microphone access
4. Say: **"I want a cheeseburger and medium fries"**

**Expected:**
- AI greets you
- You see menu on left
- Order appears on right with correct prices:
  - Cheeseburger: $6.49
  - Medium Fries: $3.49
  - Total: $9.98 ✅

---

## Advantages of This Setup

✅ **Full control** - You own the conversation logic
✅ **Accurate prices** - Menu loaded directly from menu.json
✅ **No configuration** - No need to configure agent on external platform
✅ **Free STT** - Web Speech API is built into Chrome
✅ **Fast** - Gemini 1.5 Flash is very quick
✅ **Cost effective** - Gemini is cheaper than GPT-4

---

## File Changes

- ✅ `server/config.js` - Added Gemini config
- ✅ `server/services/geminiService.js` - NEW: Gemini conversation handler
- ✅ `server/index.js` - Added `/api/chat` endpoint
- ✅ `client/src/pages/CustomerKiosk.jsx` - Complete rebuild with Web Speech API
- ✅ Removed dependency on ElevenLabs Conversational AI agent

---

## API Keys Needed

1. **Gemini API Key**: https://aistudio.google.com/app/apikey (FREE tier available)
2. **ElevenLabs API Key**: https://elevenlabs.io (for TTS)

Add both to your `.env` files and restart the servers!
