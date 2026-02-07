# =============================================================================
# main.py — Core AI Engine for thru.ai Drive-Through Ordering System
# =============================================================================
#
# WHAT THIS FILE DOES (the brain of the system):
#   This is the main orchestrator. It runs an infinite loop that:
#     1. LISTENS  — records the customer's voice via the microphone
#     2. TRANSCRIBES — converts speech → text using OpenAI Whisper (locally on GPU)
#     3. THINKS  — sends the text to Claude AI to understand the order & craft a reply
#     4. SPEAKS  — converts Claude's reply → natural speech via ElevenLabs
#     5. SYNCS   — sends the current order state to the kitchen display server
#     6. REPEATS — until the customer confirms "that's all"
#
# ARCHITECTURE FLOW (one loop iteration):
#
#   🎤 Microphone ──► Whisper (STT) ──► Claude AI ──► ElevenLabs (TTS) ──► 🔊 Speaker
#                                            │
#                                            ▼
#                                    Kitchen Display
#                                  (Flask frontend_server)
#
# TECH STACK USED HERE:
#   • sounddevice + scipy — capture raw audio from the mic, save as WAV
#   • faster-whisper      — GPU-accelerated speech-to-text (runs locally, no API call)
#   • anthropic (Claude)  — conversational AI that extracts structured order data
#   • elevenlabs          — cloud TTS that generates human-quality voice responses
#   • requests            — HTTP POST to push order state to the kitchen display
#
# WHY THESE CHOICES?
#   • Whisper LOCAL = zero latency for transcription, no network round-trip
#   • Claude Haiku = fastest Claude model, optimised for speed (<1s response)
#   • ElevenLabs  = most natural-sounding TTS, key differentiator for hackathon
#   • Flask backend = lightweight order relay, could be swapped for WebSocket later
#
# =============================================================================

import json          # Parse and serialise order data (JSON format)
import re            # Regex to extract <response> and <order> tags from Claude's output
import sounddevice as sd  # Cross-platform audio recording from system microphone
import numpy as np   # Numerical arrays — sounddevice returns audio as numpy arrays
from scipy.io.wavfile import write  # Save numpy audio array → .wav file for Whisper
import requests      # HTTP client — sends order updates to the kitchen display server
from anthropic import Anthropic  # Official Anthropic SDK for Claude AI
from elevenlabs import ElevenLabs  # Official ElevenLabs SDK for text-to-speech
from faster_whisper import WhisperModel  # CTranslate2-optimised Whisper for fast STT
import config        # Our local config.py — all API keys, model names, settings
import tempfile      # Create temporary files for audio (auto-cleaned up)
import os            # File system operations (delete temp files, play audio)


class DriveThruAI:
    """
    The main Drive-Through AI assistant class.

    This class encapsulates the ENTIRE ordering experience:
      - Initialises all three AI services (Whisper, Claude, ElevenLabs)
      - Manages conversation history so Claude remembers context across turns
      - Tracks the current order (items, total, status) as a Python dict
      - Provides the main run() loop that ties everything together

    Lifecycle:
      1. __init__()  →  load models, menu, create system prompt
      2. run()       →  greet customer, enter listen→think→speak loop
      3. Loop exits when order status becomes "complete" or user presses Ctrl+C
    """

    def __init__(self):
        """
        Initialise all AI services and load static data.

        This runs ONCE when the script starts. It:
          - Creates API client instances for Claude and ElevenLabs
          - Downloads & loads the Whisper model onto the GPU (cached after first run)
          - Loads the restaurant menu from menu.json
          - Prepares an empty conversation history and order object
          - Builds the system prompt that tells Claude how to behave
        """

        # --- API Clients ---
        # Anthropic client for Claude AI (conversation & order extraction)
        self.anthropic = Anthropic(api_key=config.ANTHROPIC_API_KEY)

        # ElevenLabs client for text-to-speech (voice responses)
        self.elevenlabs = ElevenLabs(api_key=config.ELEVENLABS_API_KEY)

        # --- Local Whisper Model (Speech-to-Text) ---
        # faster-whisper uses CTranslate2 under the hood for GPU acceleration.
        # "cuda" = run on NVIDIA GPU, "float16" = half-precision (faster, less VRAM).
        # First run downloads the model (~150 MB for "base"); subsequent runs use cache.
        print("Loading Whisper model on GPU...")
        self.whisper = WhisperModel(
            config.WHISPER_MODEL,   # Model size from config (e.g., "base")
            device="cuda",          # Use NVIDIA GPU for inference
            compute_type="float16"  # Half-precision = 2x faster, same accuracy
        )
        print("Whisper loaded!")

        # --- Menu Data ---
        # Load the restaurant menu from a JSON file.
        # This gets injected into Claude's system prompt so it knows what's available.
        # Structure: { "burgers": {...}, "sides": {...}, "drinks": {...}, "combos": {...} }
        with open('menu.json', 'r') as f:
            self.menu = json.load(f)

        # --- Conversation State ---
        # conversation_history: List of {"role": "user"/"assistant", "content": "..."}
        # This is passed to Claude every turn so it has full context of the conversation.
        # Claude uses this to remember what was already ordered, asked, etc.
        self.conversation_history = []

        # current_order: Tracks the structured order being built.
        # Claude updates this each turn by outputting <order>JSON</order>.
        # This is also sent to the kitchen display after every turn.
        self.current_order = {"items": [], "total": 0.0, "status": "in_progress"}

        # --- System Prompt ---
        # The system prompt is the "personality + rules" instruction for Claude.
        # It includes the full menu, output format requirements, and behavioral guidelines.
        self.system_prompt = self._create_system_prompt()

    # =========================================================================
    # SYSTEM PROMPT — Defines how Claude behaves as a drive-thru assistant
    # =========================================================================

    def _create_system_prompt(self):
        """
        Build the system prompt that tells Claude how to act.

        The system prompt is the MOST IMPORTANT part of the AI behaviour.
        It defines:
          1. Claude's persona (friendly drive-thru worker)
          2. The full menu (so Claude knows prices, sizes, modifiers)
          3. Behavioural rules (suggest combos, confirm items, be efficient)
          4. Output format (structured <response> + <order> tags)

        WHY STRUCTURED OUTPUT?
          We need Claude to return BOTH a natural conversation reply AND
          a machine-readable order JSON. The XML-like tags make parsing reliable.
          Claude is trained to follow these formatting instructions precisely.

        Returns:
            str: The complete system prompt string
        """
        # Pretty-print the menu JSON so Claude can read it clearly
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

    # =========================================================================
    # STEP 1: LISTEN — Record audio from the drive-thru microphone
    # =========================================================================

    def record_audio(self, duration=5):
        """
        Record raw audio from the system microphone.

        HOW IT WORKS:
          sounddevice.rec() opens the default input device (microphone),
          records for `duration` seconds, and returns a numpy array of samples.
          sd.wait() blocks until the recording finishes.

        AUDIO FORMAT:
          - Sample rate: 16 kHz (Whisper's native rate — avoids resampling)
          - Channels: 1 (mono — all we need for speech)
          - Dtype: int16 (16-bit signed integers — standard PCM format)

        IN A REAL DRIVE-THRU:
          You'd replace this with a continuous audio stream from a dedicated
          microphone, with Voice Activity Detection (VAD) to auto-detect
          when the customer starts/stops speaking instead of fixed duration.

        Args:
            duration (int): Number of seconds to record. Default 5.

        Returns:
            numpy.ndarray: Raw audio data as a 1D array of int16 samples.
        """
        print(f"\n🎤 Listening for {duration} seconds...")

        # Record: sample_count = duration × sample_rate
        # E.g., 5 sec × 16000 Hz = 80,000 samples
        audio = sd.rec(
            int(duration * config.SAMPLE_RATE),  # Total number of samples to record
            samplerate=config.SAMPLE_RATE,        # 16 kHz
            channels=config.CHANNELS,             # 1 (mono)
            dtype='int16'                         # 16-bit PCM (standard for speech)
        )
        sd.wait()  # Block here until recording completes

        print("✓ Recording complete")
        return audio

    # =========================================================================
    # STEP 2: TRANSCRIBE — Convert recorded speech to text using Whisper
    # =========================================================================

    def transcribe_audio(self, audio_data):
        """
        Convert a numpy audio array into text using OpenAI's Whisper model.

        HOW IT WORKS:
          1. Save the numpy array as a temporary .wav file (Whisper needs a file path)
          2. Run faster-whisper's transcribe() on the file using the GPU
          3. Whisper returns "segments" (chunks of transcribed text with timestamps)
          4. We join all segments into one string
          5. Delete the temp file

        WHY FASTER-WHISPER INSTEAD OF OPENAI'S WHISPER?
          faster-whisper uses CTranslate2 (optimised C++ inference engine).
          It's 4x faster than the original Whisper with the same accuracy.
          Crucial for drive-thru: customers don't want to wait.

        WHY LOCAL INSTEAD OF AN API?
          - Zero network latency (transcription happens on YOUR GPU)
          - No per-request cost (run it as many times as you want)
          - Works offline (no internet needed for this step)
          - Privacy: customer audio never leaves the device

        Args:
            audio_data (numpy.ndarray): Raw audio from record_audio()

        Returns:
            str: The transcribed text (what the customer said)
        """
        # Step 1: Save numpy array → temporary WAV file
        # Whisper expects a file path, not raw numpy data.
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_file:
            write(tmp_file.name, config.SAMPLE_RATE, audio_data)  # scipy WAV writer
            tmp_path = tmp_file.name  # Remember path so we can delete it later

        try:
            print("🧠 Transcribing with Whisper...")

            # Step 2: Run Whisper transcription on GPU
            # language="en" forces English (faster than auto-detection).
            # For multilingual support, remove this parameter or set dynamically.
            segments, info = self.whisper.transcribe(tmp_path, language="en")

            # Step 3: Combine all segments into a single string
            # Whisper splits audio into time-stamped segments; we just want the full text.
            transcript = " ".join([segment.text for segment in segments])

            print(f"📝 Customer said: {transcript}")
            return transcript

        finally:
            # Step 4: Always clean up the temp file, even if transcription fails
            os.unlink(tmp_path)

    # =========================================================================
    # STEP 3: THINK — Process the customer's words with Claude AI
    # =========================================================================

    def process_with_claude(self, customer_text):
        """
        Send the customer's transcribed text to Claude and get a response.

        HOW IT WORKS:
          1. Append the customer's message to conversation_history
          2. Send the FULL conversation history + system prompt to Claude
          3. Claude returns a response with TWO parts:
             - <response>Natural language reply to say back to customer</response>
             - <order>Structured JSON of the current order state</order>
          4. Parse both parts using regex
          5. Update self.current_order with the extracted JSON
          6. Return the conversational text (to be spoken by ElevenLabs)

        WHY FULL CONVERSATION HISTORY?
          Claude is stateless — it doesn't remember previous turns.
          By sending ALL previous messages, Claude can:
          - Remember what was already ordered ("add another one of those")
          - Track modifications ("actually, make that no pickles")
          - Know when to suggest combos (sees burger + fries + drink pattern)
          - Detect when the order is complete

        WHY STRUCTURED <response> + <order> FORMAT?
          We need to extract BOTH the spoken reply AND the order data.
          XML-like tags are easy to parse with regex and Claude follows them reliably.
          The order JSON gives us machine-readable data for the kitchen display.

        Args:
            customer_text (str): What the customer said (from Whisper transcription)

        Returns:
            str: The AI's conversational response (to be spoken via ElevenLabs)
        """
        # Add the customer's message to the conversation history
        self.conversation_history.append({
            "role": "user",
            "content": customer_text
        })

        print("🤖 Processing with Claude...")

        # Call Claude API with the full conversation context
        # - model: Claude Haiku (fastest, cheapest — ideal for real-time drive-thru)
        # - max_tokens: 1024 is plenty for a drive-thru response + order JSON
        # - system: The system prompt (persona, menu, rules, output format)
        # - messages: Full conversation history (all previous user + assistant turns)
        response = self.anthropic.messages.create(
            model=config.CLAUDE_MODEL,
            max_tokens=1024,
            system=self.system_prompt,
            messages=self.conversation_history
        )

        # Extract the raw text from Claude's response
        ai_response = response.content[0].text

        # Save Claude's response to history (so next turn has full context)
        self.conversation_history.append({
            "role": "assistant",
            "content": ai_response
        })

        # --- Parse the structured response ---

        # Extract the conversational reply (what to say to the customer)
        # Regex: everything between <response>...</response>, including newlines (re.DOTALL)
        conversation = re.search(r'<response>(.*?)</response>', ai_response, re.DOTALL)

        # Extract the order JSON (current state of the order)
        # Regex: everything between <order>...</order>
        order_json = re.search(r'<order>(.*?)</order>', ai_response, re.DOTALL)

        # Get the text to speak, or a fallback if parsing failed
        conversation_text = conversation.group(1).strip() if conversation else "Sorry, could you repeat that?"

        # Parse and update the current order from Claude's JSON
        if order_json:
            try:
                self.current_order = json.loads(order_json.group(1))
            except json.JSONDecodeError:
                # If Claude's JSON is malformed, keep the previous order state.
                # This is a safety net — Claude usually formats correctly.
                print("⚠️ Failed to parse order JSON")

        print(f"💬 AI says: {conversation_text}")
        return conversation_text

    # =========================================================================
    # STEP 4: SPEAK — Convert the AI's text response to audible speech
    # =========================================================================

    def speak(self, text):
        """
        Convert text to natural speech using ElevenLabs and play it aloud.

        HOW IT WORKS:
          1. Send the text to ElevenLabs' text-to-speech API
          2. ElevenLabs returns audio chunks (streaming response)
          3. Write all chunks to a temporary .mp3 file
          4. Play the .mp3 file using the system audio player
          5. Delete the temp file

        WHY ELEVENLABS?
          ElevenLabs produces the most natural-sounding AI voices available.
          Their "eleven_turbo_v2_5" model is optimised for low-latency streaming,
          making it perfect for real-time drive-thru conversations.
          This is the KEY differentiator for the hackathon ElevenLabs prize.

        VOICE SELECTION:
          The voice ID in config.py determines which voice is used.
          ElevenLabs has hundreds of voices in multiple languages.
          For multilingual support, you'd swap voice IDs based on detected language.

        AUDIO PLAYBACK:
          Currently uses OS-specific commands:
            - macOS: afplay (built-in)
            - Linux: mpg123 (install separately)
            - Windows: start (built-in)

        Args:
            text (str): The text to convert to speech and play
        """
        print("🔊 Speaking...")

        # Call ElevenLabs TTS API
        # - text: The string to speak
        # - voice_id: Which voice to use (from config)
        # - model_id: "eleven_turbo_v2_5" is the low-latency model (fastest)
        #   Other options: "eleven_multilingual_v2" (better for non-English)
        audio = self.elevenlabs.text_to_speech.convert(
            text=text,
            voice_id=config.ELEVENLABS_VOICE_ID,
            model_id="eleven_turbo_v2_5"  # Fastest model — optimised for real-time
        )

        # ElevenLabs returns a generator of audio chunks (streaming).
        # Write all chunks to a temp .mp3 file for playback.
        with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp_file:
            for chunk in audio:
                tmp_file.write(chunk)
            tmp_path = tmp_file.name

        try:
            # Play the audio file using the OS audio player
            # TODO: For production, use a proper audio library (e.g., pygame, pyaudio)
            #       instead of shelling out to system commands.
            os.system(f'afplay {tmp_path}')    # macOS — built-in audio player
            # os.system(f'mpg123 {tmp_path}')  # Linux — requires mpg123 installed
            # os.system(f'start {tmp_path}')   # Windows — built-in
        finally:
            # Clean up: delete the temp audio file after playback
            os.unlink(tmp_path)

    # =========================================================================
    # STEP 5: SYNC — Send the current order to the kitchen display
    # =========================================================================

    def send_to_frontend(self):
        """
        POST the current order state to the kitchen display server.

        HOW IT WORKS:
          Sends a JSON payload to the Flask frontend_server.py via HTTP POST.
          This happens AFTER EVERY AI TURN, so the kitchen display always
          shows the latest order state in real-time.

        THE ORDER JSON LOOKS LIKE:
          {
            "items": [
              {"name": "Cheeseburger", "quantity": 1, "price": 6.49, "modifiers": [], "size": null}
            ],
            "total": 6.49,
            "status": "in_progress"  // or "complete"
          }

        WHY HTTP POST (not WebSocket)?
          For this prototype, simple HTTP POST is reliable and easy to debug.
          For production, you'd upgrade to WebSocket or Server-Sent Events
          for true real-time push updates without polling.

        ERROR HANDLING:
          If the frontend server is down, we log a warning but DON'T crash.
          The AI ordering experience continues even without the kitchen display.
          This is important: the customer-facing system should never break
          because of a kitchen display issue.
        """
        try:
            response = requests.post(
                config.FRONTEND_URL,  # "http://localhost:5000/api/order"
                json=self.current_order,  # Send the full order object as JSON
                timeout=2  # Don't wait more than 2 seconds (kitchen display is non-critical)
            )
            print(f"✓ Order sent to frontend: {response.status_code}")
        except requests.exceptions.RequestException as e:
            # Graceful degradation: log the error, keep taking the order
            print(f"⚠️ Frontend not available: {e}")

    # =========================================================================
    # MAIN LOOP — Ties everything together
    # =========================================================================

    def run(self):
        """
        The main execution loop — the heart of the drive-thru AI.

        FLOW:
          1. Print startup banner
          2. Speak an initial greeting to the customer
          3. Enter the main loop:
             a. Record audio from microphone (LISTEN)
             b. Transcribe audio to text via Whisper (TRANSCRIBE)
             c. Skip if no speech detected (silence/noise)
             d. Process text with Claude AI (THINK)
             e. Speak Claude's response via ElevenLabs (SPEAK)
             f. Send order state to kitchen display (SYNC)
             g. If order is "complete", speak farewell and exit loop
          4. Handle Ctrl+C for graceful shutdown
          5. Handle unexpected errors without crashing (continue loop)

        EXIT CONDITIONS:
          - Order status becomes "complete" (customer confirmed order)
          - User presses Ctrl+C (manual termination)

        ERROR PHILOSOPHY:
          Individual errors (bad transcription, API timeout, etc.) should NOT
          kill the whole system. We catch exceptions, log them, and continue.
          The customer just hears "Sorry, could you repeat that?" at worst.
        """
        # --- Startup Banner ---
        print("\n" + "=" * 50)
        print("🍔 BURGER EXPRESS DRIVE-THRU AI")
        print("=" * 50)
        print("\nStarting order session...")

        # --- Initial Greeting ---
        # The AI speaks first (just like a real drive-thru worker would)
        greeting = "Welcome to Burger Express! What can I get for you today?"
        print(f"💬 AI says: {greeting}")
        self.speak(greeting)

        # --- Main Conversation Loop ---
        while True:
            try:
                # STEP 1: LISTEN — Record customer's voice
                audio = self.record_audio(duration=config.RECORDING_DURATION)

                # STEP 2: TRANSCRIBE — Convert speech to text
                customer_text = self.transcribe_audio(audio)

                # Skip empty transcriptions (silence, background noise)
                if not customer_text.strip():
                    print("⚠️ No speech detected, try again...")
                    continue

                # STEP 3: THINK — Process with Claude AI
                ai_response = self.process_with_claude(customer_text)

                # STEP 4: SPEAK — Play AI's response aloud
                self.speak(ai_response)

                # STEP 5: SYNC — Update kitchen display
                self.send_to_frontend()

                # --- Check if order is complete ---
                # Claude sets status to "complete" when the customer confirms.
                if self.current_order.get("status") == "complete":
                    print("\n✅ Order complete!")
                    print(f"📦 Final order: {json.dumps(self.current_order, indent=2)}")

                    # Farewell message
                    final_msg = "Great! Please pull forward to the window. Thank you!"
                    print(f"💬 AI says: {final_msg}")
                    self.speak(final_msg)
                    break  # Exit the loop — order session is done

            except KeyboardInterrupt:
                # Ctrl+C: graceful shutdown
                print("\n\n👋 Ending session...")
                break

            except Exception as e:
                # Catch-all: log the error and keep the loop running.
                # The customer experience should survive transient errors.
                print(f"❌ Error: {e}")
                continue


# =============================================================================
# ENTRY POINT — Run the Drive-Through AI
# =============================================================================
# When you run `python main.py`, this creates a DriveThruAI instance
# (which loads all models and APIs) and starts the main conversation loop.

if __name__ == "__main__":
    ai = DriveThruAI()
    ai.run()
