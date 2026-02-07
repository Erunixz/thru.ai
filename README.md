# Drive-Thru AI Demo

Complete working demo of AI-powered drive-thru order system.

## Stack
- **Whisper** (GPU) - Speech to Text
- **Claude Haiku** - Order Processing
- **ElevenLabs** - Text to Speech
- **Flask** - Frontend Server

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

### Terminal 2: Start Drive-Thru AI
```bash
python main.py
```

## Usage

1. Speak your order when prompted
2. AI will confirm and ask clarifying questions
3. Orders are sent to frontend server in real-time
4. Say "that's all" or confirm when done

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