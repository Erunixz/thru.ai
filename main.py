# main.py
import json
import re
import sounddevice as sd
import numpy as np
from scipy.io.wavfile import write
import requests
from anthropic import Anthropic
from elevenlabs import ElevenLabs
from faster_whisper import WhisperModel
import config
import tempfile
import os

class DriveThruAI:
    def __init__(self):
        # Initialize APIs
        self.anthropic = Anthropic(api_key=config.ANTHROPIC_API_KEY)
        self.elevenlabs = ElevenLabs(api_key=config.ELEVENLABS_API_KEY)
        
        # Load Whisper on GPU
        print("Loading Whisper model on GPU...")
        self.whisper = WhisperModel(
            config.WHISPER_MODEL, 
            device="cuda", 
            compute_type="float16"
        )
        print("Whisper loaded!")
        
        # Load menu
        with open('menu.json', 'r') as f:
            self.menu = json.load(f)
        
        # Initialize conversation
        self.conversation_history = []
        self.current_order = {"items": [], "total": 0.0, "status": "in_progress"}
        
        # Create system prompt
        self.system_prompt = self._create_system_prompt()
    
    def _create_system_prompt(self):
        menu_str = json.dumps(self.menu, indent=2)
        return f"""You are a friendly drive-thru order taker at Burger Express.

MENU:
{menu_str}

INSTRUCTIONS:
- Greet customers warmly when they first arrive
- Take orders accurately, confirming each item
- Ask about size for items that have sizes (fries, drinks)
- Suggest combos when customers order burger + fries + drink separately (combos save money!)
- Ask about modifications when relevant
- When order seems complete, repeat the full order back with total price
- Handle special requests politely
- If item not on menu, politely say we don't have it and suggest alternatives
- Keep responses brief and natural - this is a drive-thru, be efficient!

OUTPUT FORMAT:
Always output in this exact format:

<response>Your conversational response to the customer</response>
<order>
{{
  "items": [
    {{"name": "item name", "quantity": 1, "price": 0.00, "modifiers": ["modifier1"], "size": "medium"}}
  ],
  "total": 0.00,
  "status": "in_progress or complete"
}}
</order>

Set status to "complete" when customer confirms order is done.
"""
    
    def record_audio(self, duration=5):
        """Record audio from microphone"""
        print(f"\n🎤 Listening for {duration} seconds...")
        audio = sd.rec(
            int(duration * config.SAMPLE_RATE),
            samplerate=config.SAMPLE_RATE,
            channels=config.CHANNELS,
            dtype='int16'
        )
        sd.wait()
        print("✓ Recording complete")
        return audio
    
    def transcribe_audio(self, audio_data):
        """Convert speech to text using Whisper"""
        # Save to temporary wav file
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_file:
            write(tmp_file.name, config.SAMPLE_RATE, audio_data)
            tmp_path = tmp_file.name
        
        try:
            print("🧠 Transcribing with Whisper...")
            segments, info = self.whisper.transcribe(tmp_path, language="en")
            transcript = " ".join([segment.text for segment in segments])
            print(f"📝 Customer said: {transcript}")
            return transcript
        finally:
            os.unlink(tmp_path)
    
    def process_with_claude(self, customer_text):
        """Process order with Claude"""
        # Add customer message to history
        self.conversation_history.append({
            "role": "user",
            "content": customer_text
        })
        
        print("🤖 Processing with Claude...")
        response = self.anthropic.messages.create(
            model=config.CLAUDE_MODEL,
            max_tokens=1024,
            system=self.system_prompt,
            messages=self.conversation_history
        )
        
        ai_response = response.content[0].text
        
        # Add to history
        self.conversation_history.append({
            "role": "assistant",
            "content": ai_response
        })
        
        # Parse response
        conversation = re.search(r'<response>(.*?)</response>', ai_response, re.DOTALL)
        order_json = re.search(r'<order>(.*?)</order>', ai_response, re.DOTALL)
        
        conversation_text = conversation.group(1).strip() if conversation else "Sorry, could you repeat that?"
        
        if order_json:
            try:
                self.current_order = json.loads(order_json.group(1))
            except json.JSONDecodeError:
                print("⚠️ Failed to parse order JSON")
        
        print(f"💬 AI says: {conversation_text}")
        return conversation_text
    
    def speak(self, text):
        """Convert text to speech and play"""
        print("🔊 Speaking...")
        
        audio = self.elevenlabs.text_to_speech.convert(
            text=text,
            voice_id=config.ELEVENLABS_VOICE_ID,
            model_id="eleven_turbo_v2_5"  # Fast model
        )
        
        # Save and play audio
        with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp_file:
            for chunk in audio:
                tmp_file.write(chunk)
            tmp_path = tmp_file.name
        
        try:
            # Play audio (you can use different library based on your OS)
            os.system(f'afplay {tmp_path}')  # macOS
            # os.system(f'mpg123 {tmp_path}')  # Linux
            # os.system(f'start {tmp_path}')  # Windows
        finally:
            os.unlink(tmp_path)
    
    def send_to_frontend(self):
        """Send order to frontend server"""
        try:
            response = requests.post(
                config.FRONTEND_URL,
                json=self.current_order,
                timeout=2
            )
            print(f"✓ Order sent to frontend: {response.status_code}")
        except requests.exceptions.RequestException as e:
            print(f"⚠️ Frontend not available: {e}")
    
    def run(self):
        """Main loop"""
        print("\n" + "="*50)
        print("🍔 BURGER EXPRESS DRIVE-THRU AI")
        print("="*50)
        print("\nStarting order session...")
        
        # Initial greeting
        greeting = "Welcome to Burger Express! What can I get for you today?"
        print(f"💬 AI says: {greeting}")
        self.speak(greeting)
        
        while True:
            try:
                # Record customer
                audio = self.record_audio(duration=config.RECORDING_DURATION)
                
                # Transcribe
                customer_text = self.transcribe_audio(audio)
                
                if not customer_text.strip():
                    print("⚠️ No speech detected, try again...")
                    continue
                
                # Process with Claude
                ai_response = self.process_with_claude(customer_text)
                
                # Speak response
                self.speak(ai_response)
                
                # Send to frontend
                self.send_to_frontend()
                
                # Check if order is complete
                if self.current_order.get("status") == "complete":
                    print("\n✅ Order complete!")
                    print(f"📦 Final order: {json.dumps(self.current_order, indent=2)}")
                    
                    final_msg = "Great! Please pull forward to the window. Thank you!"
                    print(f"💬 AI says: {final_msg}")
                    self.speak(final_msg)
                    break
                
            except KeyboardInterrupt:
                print("\n\n👋 Ending session...")
                break
            except Exception as e:
                print(f"❌ Error: {e}")
                continue

if __name__ == "__main__":
    ai = DriveThruAI()
    ai.run()