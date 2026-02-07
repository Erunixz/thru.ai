// =============================================================================
// client/src/pages/CustomerKiosk.jsx — Main Customer-Facing Drive-Thru Screen
// =============================================================================
//
// PURPOSE:
//   This is THE screen the customer sees at the drive-thru speaker box.
//   It runs on a mounted display/tablet in a Chrome kiosk window.
//
// LAYOUT:
//   ┌──────────────────────────────────────────────────────┐
//   │  Header: "Burger Express" logo + status indicator     │
//   ├──────────────────────┬───────────────────────────────┤
//   │                      │                               │
//   │   Conversation       │      Order Summary            │
//   │   Transcript         │      (items + total)          │
//   │   (chat bubbles)     │                               │
//   │                      │                               │
//   ├──────────────────────┴───────────────────────────────┤
//   │           [ 🎤 Microphone Button ]                    │
//   │           Status text (Listening... / Thinking...)     │
//   └──────────────────────────────────────────────────────┘
//
// STATE MACHINE:
//   The kiosk has a simple state machine controlling the conversation flow:
//
//   [idle] → user taps "Start Order"
//     → [greeting] → AI greets, plays audio
//       → [listening] → mic is on, recording customer speech
//         → [processing] → text sent to Claude AI, waiting for response
//           → [speaking] → AI response audio playing via ElevenLabs
//             → [listening] (loop back — next turn)
//               → ... until order is "complete"
//                 → [complete] → farewell message, order finalized
//
// =============================================================================

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UtensilsCrossed, Wifi, WifiOff } from 'lucide-react';
import VoiceInput from '../components/VoiceInput';
import OrderPanel from '../components/OrderPanel';
import Conversation from '../components/Conversation';
import { startSession, sendMessage, playAudio } from '../services/api';

export default function CustomerKiosk() {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  // Current phase of the conversation flow
  // "idle" | "greeting" | "listening" | "processing" | "speaking" | "complete"
  const [status, setStatus] = useState('idle');

  // The session ID returned by the server (used in all subsequent API calls)
  const [sessionId, setSessionId] = useState(null);

  // Conversation messages: [{ role: "user"|"assistant", text, timestamp }]
  const [messages, setMessages] = useState([]);

  // Current order state from the server: { items, total, status }
  const [order, setOrder] = useState(null);

  // Error message to display (if something goes wrong)
  const [error, setError] = useState(null);

  // ---------------------------------------------------------------------------
  // Start Order — Called when customer taps "Start Order"
  // ---------------------------------------------------------------------------
  const handleStartOrder = useCallback(async () => {
    try {
      setError(null);
      setStatus('greeting');

      // Call the server to create a new session
      const data = await startSession();

      // Store the session ID for subsequent API calls
      setSessionId(data.sessionId);
      setOrder(data.order);

      // Add the AI's greeting to the conversation
      setMessages([{
        role: 'assistant',
        text: data.text,
        timestamp: new Date(),
      }]);

      // Play the greeting audio (ElevenLabs)
      setStatus('speaking');
      await playAudio(data.audio);

      // After audio finishes, turn on the mic
      setStatus('listening');
    } catch (err) {
      console.error('Failed to start session:', err);
      setError(err.message);
      setStatus('idle');
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Handle Customer Speech — Called when Web Speech API captures text
  // ---------------------------------------------------------------------------
  const handleTranscript = useCallback(
    async (transcript) => {
      if (!sessionId) return;

      try {
        setError(null);

        // Add the customer's message to the conversation
        setMessages((prev) => [
          ...prev,
          { role: 'user', text: transcript, timestamp: new Date() },
        ]);

        // Switch to "processing" state (shows spinner)
        setStatus('processing');

        // Send the text to the server → Claude AI → ElevenLabs
        const data = await sendMessage(sessionId, transcript);

        // Add the AI's response to the conversation
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', text: data.text, timestamp: new Date() },
        ]);

        // Update the order display
        setOrder(data.order);

        // Play the AI's response audio
        setStatus('speaking');
        await playAudio(data.audio);

        // If the order is complete, show the "complete" state
        if (data.isComplete) {
          setStatus('complete');
        } else {
          // Otherwise, turn the mic back on for the next turn
          setStatus('listening');
        }
      } catch (err) {
        console.error('Conversation error:', err);
        setError(err.message);
        // Go back to listening so the customer can try again
        setStatus('listening');
      }
    },
    [sessionId]
  );

  // ---------------------------------------------------------------------------
  // Reset — Start a new order (after completing one)
  // ---------------------------------------------------------------------------
  const handleNewOrder = useCallback(() => {
    setStatus('idle');
    setSessionId(null);
    setMessages([]);
    setOrder(null);
    setError(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
      {/* === HEADER === */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-slate-800/50">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
            <UtensilsCrossed className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Burger Express
            </h1>
            <p className="text-xs text-slate-500">AI Drive-Through</p>
          </div>
        </div>

        {/* Connection status indicator */}
        <div className="flex items-center gap-2 text-sm">
          {status !== 'idle' ? (
            <span className="flex items-center gap-1.5 text-green-400">
              <Wifi className="w-4 h-4" />
              Session Active
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-slate-500">
              <WifiOff className="w-4 h-4" />
              Ready
            </span>
          )}
        </div>
      </header>

      {/* === MAIN CONTENT === */}
      {status === 'idle' ? (
        // --- Start Order Screen ---
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <motion.div
              className="w-24 h-24 bg-brand-500 rounded-3xl flex items-center justify-center mx-auto mb-8"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <UtensilsCrossed className="w-14 h-14 text-white" />
            </motion.div>

            <h2 className="text-4xl font-bold text-white mb-3">
              Welcome to Burger Express
            </h2>
            <p className="text-xl text-slate-400 mb-10">
              Tap below to start your order
            </p>

            <motion.button
              onClick={handleStartOrder}
              className="bg-brand-500 hover:bg-brand-600 text-white text-xl font-semibold px-12 py-5 rounded-2xl shadow-lg shadow-brand-500/25 transition-colors"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Start Order
            </motion.button>
          </motion.div>
        </div>
      ) : (
        // --- Active Order Screen (conversation + order panel) ---
        <div className="flex-1 flex overflow-hidden">
          {/* Left side: Conversation transcript */}
          <div className="flex-1 flex flex-col min-w-0">
            <Conversation messages={messages} />
          </div>

          {/* Right side: Order summary panel */}
          <div className="w-80 lg:w-96 border-l border-slate-800/50 flex-shrink-0">
            <OrderPanel order={order} />
          </div>
        </div>
      )}

      {/* === FOOTER: Mic Button + Status === */}
      {status !== 'idle' && (
        <footer className="border-t border-slate-800/50 px-8 py-5">
          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-2 mb-4 text-sm text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {status === 'complete' ? (
            // Order complete — show farewell + new order button
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <p className="text-2xl font-bold text-green-400 mb-2">
                Order Complete!
              </p>
              <p className="text-slate-400 mb-4">
                Please pull forward to the window. Thank you!
              </p>
              <button
                onClick={handleNewOrder}
                className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2.5 rounded-lg transition-colors text-sm"
              >
                New Order
              </button>
            </motion.div>
          ) : (
            // Active ordering — show mic button
            <VoiceInput
              onTranscript={handleTranscript}
              disabled={status === 'processing' || status === 'greeting'}
              status={status}
            />
          )}
        </footer>
      )}
    </div>
  );
}
