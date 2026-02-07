# Drive-Thru AI Demo 🍔🎤

Complete working demo of AI-powered drive-thru order system with McDonald's-style kiosk interface.

## Features

✅ **Voice AI Ordering** - Customers order via voice through drive-thru
✅ **Touch-Screen Kiosk** - Beautiful McDonald's-style ordering interface
✅ **Real-Time Sync** - Voice orders appear live on kiosk display
✅ **Dual Mode** - Manual touch ordering OR AI voice ordering

## Stack
- **Whisper** (GPU) - Speech to Text
- **Claude Haiku** - Order Processing & Conversation
- **ElevenLabs** - Text to Speech
- **Flask** - Backend API Server
- **HTML/CSS/JS** - McDonald's-Style Kiosk Frontend

## Setup

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure API Keys
Edit `config.py` and add your API keys:
- Get Claude key: https://console.anthropic.com/
- Get ElevenLabs key: https://elevenlabs.io/

### 3. Install CUDA (for GPU Whisper)
Make sure you have NVIDIA drivers and CUDA installed.

## Running

### Terminal 1: Start Frontend Server
```bash
python frontend_server.py
```

Server runs on http://localhost:3001

### Terminal 2: Open Kiosk Interface
Open browser to: **http://localhost:3001**

You'll see a beautiful McDonald's-style ordering interface!

### Terminal 3: Start AI Voice System (Optional)
```bash
python main.py
```

## Usage

### Option 1: Manual Touch Ordering (No Voice)
1. Open http://localhost:3001 in browser
2. Click "Touch to Order"
3. Browse menu by category (Burgers, Combos, Sides, Drinks)
4. Add items to cart
5. Adjust quantities in order summary
6. Click "Complete Order"

### Option 2: AI Voice Ordering
1. Start both `frontend_server.py` AND `main.py`
2. Open http://localhost:3001 in browser
3. Speak your order at the drive-thru microphone
4. Watch orders appear LIVE on the kiosk screen!
5. AI confirms items and calculates totals
6. Order auto-completes when customer is done

### Option 3: Hybrid Mode
- Use manual touch ordering normally
- Voice orders from `main.py` appear automatically on screen
- Perfect for demos showing both modes!

## Testing Without Microphone

Modify `main.py` to use text input instead:
```python
# In run() method, replace:
# audio = self.record_audio()
# customer_text = self.transcribe_audio(audio)

# With:
customer_text = input("Customer: ")
```

## Notes

- Adjust `RECORDING_DURATION` in config.py for longer/shorter listening
- Change `WHISPER_MODEL` to "small" or "medium" for better accuracy
- Audio playback command in `speak()` may need adjustment for your OS