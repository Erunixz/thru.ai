// =============================================================================
// client/src/pages/CustomerKiosk.jsx — Custom LLM Drive-Thru
// =============================================================================
//
// Voice ordering with Gemini LLM backend:
// - Web Speech API for speech-to-text (browser)
// - Gemini API for conversation (backend)
// - ElevenLabs for text-to-speech
// - Real-time order updates
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
  PhoneOff,
  MicOff,
} from 'lucide-react';
import OrderPanel from '../components/OrderPanel';
import MenuDisplay from '../components/MenuDisplay';

export default function CustomerKiosk() {
  // State
  const [connectionStatus, setConnectionStatus] = useState('idle');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [menu, setMenu] = useState([]);
  const [transcript, setTranscript] = useState('');

  // Refs
  const recognitionRef = useRef(null);
  const orderIdRef = useRef(null);
  const audioRef = useRef(new Audio());
  const isFirstMessageRef = useRef(true);

  // Fetch menu
  useEffect(() => {
    fetch('/api/menu')
      .then(res => res.json())
      .then(data => setMenu(data))
      .catch(err => console.error('Failed to load menu:', err));
  }, []);

  // Initialize Web Speech API
  const initializeSpeechRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition not supported in this browser');
      return null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('🎤 Listening...');
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = async (event) => {
      const lastResult = event.results[event.results.length - 1];
      if (lastResult.isFinal) {
        const text = lastResult[0].transcript;
        console.log('👤 User said:', text);
        setTranscript(text);

        // Stop listening while processing
        recognition.stop();
        setIsListening(false);

        // Send to backend
        await sendMessageToAI(text);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        setError(`Speech error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      console.log('🎤 Stopped listening');
      setIsListening(false);

      // Auto-restart if still connected and not speaking
      if (connectionStatus === 'connected' && !isSpeaking && !isComplete) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch (e) {
            console.log('Recognition already started');
          }
        }, 500);
      }
    };

    return recognition;
  }, [connectionStatus, isSpeaking, isComplete]);

  // Send message to Gemini backend
  const sendMessageToAI = async (message) => {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderIdRef.current,
          message,
          isFirstMessage: isFirstMessageRef.current
        })
      });

      if (!res.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await res.json();
      console.log('🤖 AI response:', data);

      isFirstMessageRef.current = false;

      // Update order if present
      if (data.order) {
        setOrder({
          items: data.order.items,
          total: data.order.total,
          status: data.order.status
        });

        if (data.order.status === 'complete') {
          setIsComplete(true);
        }
      }

      // Speak the response
      await speakText(data.message);

    } catch (error) {
      console.error('Error communicating with AI:', error);
      setError(error.message);
    }
  };

  // Text-to-speech using ElevenLabs
  const speakText = async (text) => {
    try {
      setIsSpeaking(true);

      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': import.meta.env.VITE_ELEVENLABS_API_KEY || ''
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        })
      });

      if (!res.ok) {
        throw new Error('TTS failed');
      }

      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      audioRef.current.src = audioUrl;
      audioRef.current.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audioRef.current.play();

    } catch (error) {
      console.error('TTS error:', error);
      setIsSpeaking(false);
    }
  };

  // Start order
  const handleStartOrder = useCallback(async () => {
    try {
      setError(null);
      setConnectionStatus('connecting');
      setOrder(null);
      setIsComplete(false);
      isFirstMessageRef.current = true;

      // Create order ID
      orderIdRef.current = `order-${Date.now()}`;

      // Initialize speech recognition
      const recognition = initializeSpeechRecognition();
      if (!recognition) {
        throw new Error('Speech recognition not available');
      }

      recognitionRef.current = recognition;

      setConnectionStatus('connected');

      // Send initial greeting message to AI
      await sendMessageToAI('Hello');

      // Start listening
      setTimeout(() => {
        try {
          recognition.start();
        } catch (e) {
          console.log('Recognition already started');
        }
      }, 1000);

    } catch (err) {
      console.error('Start order error:', err);
      setError(err.message || 'Failed to start conversation');
      setConnectionStatus('idle');
    }
  }, [initializeSpeechRecognition]);

  // End order
  const handleEndOrder = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setConnectionStatus('idle');
    setIsListening(false);
    setIsSpeaking(false);
    setOrder(null);
    setIsComplete(false);
    orderIdRef.current = null;
    setTranscript('');
  }, []);

  const isActive = connectionStatus === 'connected';
  const isConnecting = connectionStatus === 'connecting';

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
            <p className="text-xs text-slate-500">AI Drive-Through (Gemini)</p>
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
            <p className="text-xl text-slate-400 mb-10">Press the button to start ordering by voice</p>
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
          <div className="flex-1 min-w-0">
            <MenuDisplay menuItems={menu} />
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
              <div className="flex flex-col items-center gap-3">
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
                    {isConnecting ? <Loader2 className="w-9 h-9 animate-spin" /> : isSpeaking ? <Volume2 className="w-9 h-9" /> : isListening ? <Mic className="w-9 h-9" /> : <MicOff className="w-9 h-9" />}
                  </div>
                </div>

                <p className="text-base text-slate-400 text-center">
                  {isConnecting ? 'Connecting...' : isSpeaking ? 'AI is speaking...' : isListening ? 'Listening — speak your order' : 'Processing...'}
                </p>

                {transcript && (
                  <p className="text-sm text-slate-500 italic">You said: "{transcript}"</p>
                )}
              </div>

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
