// =============================================================================
// client/src/pages/CustomerKiosk.jsx — Drive-Thru Customer Screen
// =============================================================================
//
// Uses ElevenLabs Conversational AI Agent via @elevenlabs/client.
// The agent handles mic capture, STT, conversation AI, and TTS.
// Our code displays the conversation, order panel, and audio visualization.
//
// =============================================================================

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UtensilsCrossed,
  Wifi,
  WifiOff,
  Mic,
  Volume2,
  Loader2,
  Send,
  PhoneOff,
} from 'lucide-react';
import { Conversation } from '@elevenlabs/client';
import OrderPanel from '../components/OrderPanel';
import ConversationPanel from '../components/Conversation';

export default function CustomerKiosk() {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [connectionStatus, setConnectionStatus] = useState('idle');
  const [agentMode, setAgentMode] = useState('listening');
  const [messages, setMessages] = useState([]);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [audioLevels, setAudioLevels] = useState([0, 0, 0, 0, 0]);

  // Text input fallback
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);

  // Refs
  const conversationRef = useRef(null);
  const animFrameRef = useRef(null);
  const orderIdRef = useRef(null);

  // ---------------------------------------------------------------------------
  // Audio Visualization — reads frequency data from the Conversation instance
  // ---------------------------------------------------------------------------
  const updateVisualization = useCallback(() => {
    if (!conversationRef.current) {
      setAudioLevels([0, 0, 0, 0, 0]);
      return;
    }

    try {
      let data = null;
      try { data = conversationRef.current.getInputByteFrequencyData?.(); } catch {}
      if (!data || data.length === 0) {
        try { data = conversationRef.current.getOutputByteFrequencyData?.(); } catch {}
      }

      if (data && data.length > 0) {
        const step = Math.floor(data.length / 5);
        const levels = [];
        for (let i = 0; i < 5; i++) {
          let sum = 0;
          for (let j = i * step; j < (i + 1) * step && j < data.length; j++) {
            sum += data[j];
          }
          levels.push(step > 0 ? sum / step / 255 : 0);
        }
        setAudioLevels(levels);
      } else {
        setAudioLevels([0, 0, 0, 0, 0]);
      }
    } catch {
      setAudioLevels([0, 0, 0, 0, 0]);
    }

    animFrameRef.current = requestAnimationFrame(updateVisualization);
  }, []);

  useEffect(() => {
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, []);

  // ---------------------------------------------------------------------------
  // Start Order — connect to ElevenLabs Agent
  // ---------------------------------------------------------------------------
  const handleStartOrder = useCallback(async () => {
    try {
      setError(null);
      setConnectionStatus('connecting');
      setMessages([]);
      setOrder(null);
      setIsComplete(false);

      // Request mic permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get signed URL + order from server
      const res = await fetch('/api/agent/signed-url');
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error: ${res.status}`);
      }
      const { signedUrl, orderId: newOrderId, order: newOrder } = await res.json();

      orderIdRef.current = newOrderId;
      setOrder(newOrder);

      // Start ElevenLabs conversation
      const conversation = await Conversation.startSession({
        signedUrl,

        onConnect: () => {
          console.log('✅ Agent connected');
          setConnectionStatus('connected');
        },

        onDisconnect: () => {
          console.log('🔌 Agent disconnected');
          setConnectionStatus('disconnected');
          if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
            animFrameRef.current = null;
          }
          setAudioLevels([0, 0, 0, 0, 0]);
        },

        onMessage: (message) => {
          const text = message?.message ?? message?.content ?? message?.text ?? '';
          const source = message?.source ?? message?.role ?? 'ai';

          if (text && text.trim()) {
            setMessages((prev) => [
              ...prev,
              {
                role: source === 'user' ? 'user' : 'assistant',
                text: text.trim(),
                timestamp: new Date(),
              },
            ]);
          }
        },

        onModeChange: (mode) => {
          const m = typeof mode === 'string' ? mode : mode?.mode;
          if (m) setAgentMode(m);
        },

        onError: (err) => {
          console.error('Agent error:', err);
          setError(typeof err === 'string' ? err : err?.message || 'Agent error');
        },

        // Client tools — agent calls these during conversation
        clientTools: {
          update_order: async (parameters) => {
            console.log('🛒 Order update:', parameters);

            // Parse items if it's a JSON string (due to ElevenLabs tool limitations)
            let items = parameters?.items || [];
            if (typeof items === 'string') {
              try {
                items = JSON.parse(items);
              } catch (e) {
                console.error('Failed to parse items:', e);
                items = [];
              }
            }

            const total = parameters?.total || 0;
            const status = parameters?.status || 'in_progress';

            setOrder((prev) => ({ ...(prev || {}), items, total, status }));

            if (status === 'complete') setIsComplete(true);

            // Send to server for kitchen display
            try {
              await fetch('/api/orders/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: orderIdRef.current, items, total, status }),
              });
            } catch (e) {
              console.warn('Failed to update server:', e);
            }

            return 'Order updated successfully';
          },
        },
      });

      conversationRef.current = conversation;
      animFrameRef.current = requestAnimationFrame(updateVisualization);

    } catch (err) {
      console.error('Start order error:', err);
      setError(err.message || 'Failed to start conversation');
      setConnectionStatus('idle');
    }
  }, [updateVisualization]);

  // ---------------------------------------------------------------------------
  // Text input fallback
  // ---------------------------------------------------------------------------
  const handleTextSubmit = useCallback((e) => {
    e.preventDefault();
    if (!conversationRef.current || !textInput.trim()) return;
    conversationRef.current.sendUserMessage(textInput.trim());
    setTextInput('');
  }, [textInput]);

  // ---------------------------------------------------------------------------
  // End / New Order
  // ---------------------------------------------------------------------------
  const handleEndOrder = useCallback(async () => {
    if (conversationRef.current) {
      try { await conversationRef.current.endSession(); } catch {}
      conversationRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setConnectionStatus('idle');
    setAgentMode('listening');
    setMessages([]);
    setOrder(null);
    orderIdRef.current = null;
    setError(null);
    setIsComplete(false);
    setAudioLevels([0, 0, 0, 0, 0]);
    setShowTextInput(false);
    setTextInput('');
  }, []);

  // ---------------------------------------------------------------------------
  // Derived
  // ---------------------------------------------------------------------------
  const isActive = connectionStatus === 'connected';
  const isConnecting = connectionStatus === 'connecting';
  const isSpeaking = agentMode === 'speaking' && isActive;
  const isListening = agentMode === 'listening' && isActive;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
      {/* HEADER */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
            <UtensilsCrossed className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Burger Express</h1>
            <p className="text-xs text-slate-500">AI Drive-Through</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          {isActive ? (
            <span className="flex items-center gap-1.5 text-green-400"><Wifi className="w-4 h-4" /> Connected</span>
          ) : isConnecting ? (
            <span className="flex items-center gap-1.5 text-yellow-400"><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</span>
          ) : (
            <span className="flex items-center gap-1.5 text-slate-500"><WifiOff className="w-4 h-4" /> Ready</span>
          )}
        </div>
      </header>

      {/* MAIN */}
      {connectionStatus === 'idle' ? (
        <div className="flex-1 flex items-center justify-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <motion.div
              className="w-24 h-24 bg-brand-500 rounded-3xl flex items-center justify-center mx-auto mb-8"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <UtensilsCrossed className="w-14 h-14 text-white" />
            </motion.div>
            <h2 className="text-4xl font-bold text-white mb-3">Welcome to Burger Express</h2>
            <p className="text-xl text-slate-400 mb-10">Tap below to start your order</p>
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
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col min-w-0">
            <ConversationPanel messages={messages} />
          </div>
          <div className="w-80 lg:w-96 border-l border-slate-800/50 flex-shrink-0">
            <OrderPanel order={order} />
          </div>
        </div>
      )}

      {/* FOOTER */}
      {connectionStatus !== 'idle' && (
        <footer className="border-t border-slate-800/50 px-8 py-4">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-2 mb-3 text-sm text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {isComplete ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-2">
              <p className="text-2xl font-bold text-green-400 mb-2">Order Complete!</p>
              <p className="text-slate-400 mb-4">Please pull forward to the window. Thank you!</p>
              <button onClick={handleEndOrder} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2.5 rounded-lg transition-colors text-sm">
                New Order
              </button>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {/* Voice status + visualization */}
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-6">
                  {/* Audio bars left */}
                  <div className="flex items-end gap-1 h-16 w-16 justify-center">
                    {audioLevels.slice(0, 3).map((level, i) => (
                      <motion.div
                        key={`l${i}`}
                        className={`w-1.5 rounded-full ${isSpeaking ? 'bg-brand-400' : isListening ? 'bg-green-400' : 'bg-slate-600'}`}
                        animate={{ height: isActive ? Math.max(6, level * 56) : 6 }}
                        transition={{ duration: 0.08 }}
                      />
                    ))}
                  </div>

                  {/* Mic indicator */}
                  <div className="relative">
                    {isListening && (
                      <motion.div
                        className="absolute inset-0 rounded-full bg-green-500"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                    <div className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg ${
                      isConnecting ? 'bg-slate-600' : isSpeaking ? 'bg-brand-500' : isListening ? 'bg-green-500' : 'bg-slate-700'
                    }`}>
                      {isConnecting ? <Loader2 className="w-9 h-9 animate-spin" /> : isSpeaking ? <Volume2 className="w-9 h-9" /> : <Mic className="w-9 h-9" />}
                    </div>
                  </div>

                  {/* Audio bars right */}
                  <div className="flex items-end gap-1 h-16 w-16 justify-center">
                    {audioLevels.slice(2, 5).map((level, i) => (
                      <motion.div
                        key={`r${i}`}
                        className={`w-1.5 rounded-full ${isSpeaking ? 'bg-brand-400' : isListening ? 'bg-green-400' : 'bg-slate-600'}`}
                        animate={{ height: isActive ? Math.max(6, level * 56) : 6 }}
                        transition={{ duration: 0.08 }}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-base text-slate-400 text-center">
                  {isConnecting ? 'Connecting to Burger Express...' : isSpeaking ? 'AI is speaking...' : isListening ? 'Listening — speak now' : 'Ready'}
                </p>
              </div>

              {/* Text fallback */}
              <div className="text-center">
                {!showTextInput ? (
                  <button onClick={() => setShowTextInput(true)} className="text-slate-500 hover:text-slate-400 text-xs transition-colors">
                    or type your order instead
                  </button>
                ) : (
                  <form onSubmit={handleTextSubmit} className="flex gap-2 max-w-lg mx-auto">
                    <input
                      type="text"
                      value={textInput}
                      onChange={(e) => { setTextInput(e.target.value); conversationRef.current?.sendUserActivity?.(); }}
                      placeholder="Type your order here..."
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500"
                      disabled={!isActive}
                      autoFocus
                    />
                    <button type="submit" disabled={!textInput.trim() || !isActive} className="bg-brand-500 hover:bg-brand-600 disabled:bg-slate-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg transition-colors">
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </div>

              {/* End order */}
              {(isActive || isConnecting) && (
                <div className="text-center">
                  <button onClick={handleEndOrder} className="flex items-center gap-1.5 mx-auto text-red-400/60 hover:text-red-400 text-xs transition-colors">
                    <PhoneOff className="w-3 h-3" /> End Conversation
                  </button>
                </div>
              )}
            </div>
          )}
        </footer>
      )}
    </div>
  );
}
