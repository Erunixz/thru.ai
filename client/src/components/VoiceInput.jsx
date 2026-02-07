// =============================================================================
// client/src/components/VoiceInput.jsx — Voice Input Button with Visualization
// =============================================================================
//
// PURPOSE:
//   The big microphone button at the bottom of the customer kiosk.
//   Uses the browser's Web Speech API to capture the customer's voice and
//   convert it to text. Shows visual feedback for each state:
//     - IDLE: Waiting for click → grey mic icon
//     - LISTENING: Recording speech → pulsing green ring + animated bars
//     - PROCESSING: Waiting for AI → spinning indicator
//     - SPEAKING: AI is talking → orange speaker icon
//
// HOW WEB SPEECH API WORKS:
//   1. Create a SpeechRecognition instance (built into Chrome/Edge)
//   2. Call .start() → browser opens the mic and starts transcribing
//   3. Listen for "result" event → gives us the transcribed text
//   4. Listen for "end" event → mic stopped (silence detected or timeout)
//   No API key needed — it's a built-in browser feature.
//
// WHY WEB SPEECH API (not Whisper)?
//   - Zero setup — works in Chrome out of the box
//   - No GPU required — runs in the browser
//   - No API cost — it's free
//   - Good accuracy for English (uses Google's speech engine)
//   - For the hackathon, this is the fastest path to a working demo
//
// PROPS:
//   onTranscript(text) — called when speech is fully transcribed
//   disabled — disables the button (e.g., during AI processing)
//   status — "idle" | "listening" | "processing" | "speaking"
//
// =============================================================================

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Loader2, Volume2 } from 'lucide-react';

export default function VoiceInput({ onTranscript, disabled, status }) {
  // interimText: partial transcription shown while user is still speaking
  const [interimText, setInterimText] = useState('');

  // Ref to the SpeechRecognition instance (persists across renders)
  const recognitionRef = useRef(null);

  // -------------------------------------------------------------------------
  // Initialize the Web Speech API once on mount
  // -------------------------------------------------------------------------
  useEffect(() => {
    // Check browser support (Chrome, Edge — NOT Firefox/Safari)
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Web Speech API is not supported in this browser.');
      return;
    }

    // Create and configure the recognition instance
    const recognition = new SpeechRecognition();
    recognition.continuous = false;       // Stop after one utterance (one turn)
    recognition.interimResults = true;    // Show partial results while speaking
    recognition.lang = 'en-US';           // Language (change for multilingual)
    recognition.maxAlternatives = 1;      // We only need the best result

    // --- Handle results (interim and final) ---
    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;

      if (result.isFinal) {
        // Final transcription — send to parent component
        setInterimText('');
        if (transcript.trim()) {
          onTranscript(transcript.trim());
        }
      } else {
        // Interim (partial) transcription — show as preview
        setInterimText(transcript);
      }
    };

    // --- Handle errors ---
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setInterimText('');
    };

    // --- Handle end (mic stopped) ---
    recognition.onend = () => {
      setInterimText('');
    };

    recognitionRef.current = recognition;

    // Cleanup on unmount
    return () => {
      recognition.abort();
    };
  }, [onTranscript]);

  // -------------------------------------------------------------------------
  // Start listening when status changes to "listening"
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (status === 'listening' && recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        // Already started — ignore
        console.warn('Recognition already started');
      }
    } else if (status !== 'listening' && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        // Not started — ignore
      }
    }
  }, [status]);

  // -------------------------------------------------------------------------
  // Determine button appearance based on current status
  // -------------------------------------------------------------------------
  const isListening = status === 'listening';
  const isProcessing = status === 'processing';
  const isSpeaking = status === 'speaking';

  // Choose the icon to display
  const renderIcon = () => {
    if (isProcessing) return <Loader2 className="w-10 h-10 animate-spin" />;
    if (isSpeaking) return <Volume2 className="w-10 h-10" />;
    if (isListening) return <Mic className="w-10 h-10" />;
    return <Mic className="w-10 h-10" />;
  };

  // Choose the status text below the button
  const renderStatusText = () => {
    if (isProcessing) return 'Thinking...';
    if (isSpeaking) return 'Speaking...';
    if (isListening) return interimText || 'Listening...';
    return 'Tap to speak';
  };

  // Choose the button color
  const buttonColor = isListening
    ? 'bg-green-500 hover:bg-green-600'
    : isSpeaking
    ? 'bg-brand-500 hover:bg-brand-600'
    : isProcessing
    ? 'bg-slate-600'
    : 'bg-slate-700 hover:bg-slate-600';

  return (
    <div className="flex flex-col items-center gap-4">
      {/* --- Mic Button with Pulse Animation --- */}
      <div className="relative">
        {/* Pulsing ring animation (only when listening) */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              className="absolute inset-0 rounded-full bg-green-500"
              initial={{ scale: 1, opacity: 0.3 }}
              animate={{ scale: 1.6, opacity: 0 }}
              exit={{ scale: 1, opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </AnimatePresence>

        {/* The actual button */}
        <motion.button
          className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg transition-colors ${buttonColor}`}
          disabled={disabled || isProcessing}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
        >
          {renderIcon()}
        </motion.button>
      </div>

      {/* --- Status Text --- */}
      <motion.p
        className="text-lg text-slate-400 text-center min-h-[2rem] max-w-md"
        key={status + interimText}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {renderStatusText()}
      </motion.p>
    </div>
  );
}
