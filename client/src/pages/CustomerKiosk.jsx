// =============================================================================
// client/src/pages/CustomerKiosk.jsx — Drive-Thru Customer Screen
// =============================================================================
//
// Uses ElevenLabs Conversational AI Agent via @elevenlabs/client.
// The agent handles mic capture, STT, conversation AI, and TTS.
// Our code displays the conversation, order panel, and audio visualization.
//
// =============================================================================

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UtensilsCrossed,
  WifiOff,
  Mic,
  Volume2,
  Loader2,
  Send,
  PhoneOff,
} from 'lucide-react';
import { Conversation } from '@elevenlabs/client';
import OrderPanel from '../components/OrderPanel';
import MenuDisplay from '../components/MenuDisplay';
import { usePersonDetection } from '../hooks/usePersonDetection';
import DetectionStatusIndicator from '../components/DetectionStatusIndicator';
import CameraPreview from '../components/CameraPreview';
import { getDetectionConfig, saveDetectionConfig } from '../utils/personDetectionHelper';

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
  const [menu, setMenu] = useState(null);

  // Text input fallback
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);

  // Person detection state
  const detectionConfig = useMemo(() => getDetectionConfig(), []);
  const [detectionEnabled, setDetectionEnabled] = useState(() => detectionConfig.enabled);
  const [showCameraPreview, setShowCameraPreview] = useState(false);

  // Refs
  const conversationRef = useRef(null);
  const animFrameRef = useRef(null);
  const orderIdRef = useRef(null);
  const autoStartTimerRef = useRef(null);
  const autoStopTimerRef = useRef(null);

  // ---------------------------------------------------------------------------
  // Person Detection Hook
  // ---------------------------------------------------------------------------
  const {
    isPersonDetected,
    detectionConfidence,
    isModelLoading,
    isDetectionActive,
    error: detectionError,
    videoElement,
    currentFPS,
    startDetection,
    stopDetection,
    toggleDetection,
  } = usePersonDetection({
    autoStart: detectionEnabled,
    fps: detectionConfig.detectionFPS,
    confidenceThreshold: detectionConfig.confidenceThreshold,
  });

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

  // Load menu on mount
  useEffect(() => {
    fetch('/api/menu')
      .then(res => res.json())
      .then(data => setMenu(data))
      .catch(err => console.error('Failed to load menu:', err));
  }, []);

  // ---------------------------------------------------------------------------
  // Auto-start when person detected for configured delay (default: 1s)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // Clear any existing timer
    if (autoStartTimerRef.current) {
      clearTimeout(autoStartTimerRef.current);
      autoStartTimerRef.current = null;
    }

    // Only auto-start if:
    // - Detection is enabled
    // - Not already connected or connecting
    // - Person is detected
    // - Not in error state
    if (
      detectionEnabled &&
      connectionStatus === 'idle' &&
      isPersonDetected &&
      !detectionError
    ) {
      console.log(`Person detected, auto-starting in ${detectionConfig.startDelay}ms...`);
      autoStartTimerRef.current = setTimeout(() => {
        console.log('Auto-starting conversation...');
        handleStartOrder();
      }, detectionConfig.startDelay);
    }

    return () => {
      if (autoStartTimerRef.current) {
        clearTimeout(autoStartTimerRef.current);
        autoStartTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPersonDetected, connectionStatus, detectionEnabled, detectionError, detectionConfig.startDelay]);

  // ---------------------------------------------------------------------------
  // Auto-stop when person leaves for configured delay (default: 5s)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // Clear any existing timer
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }

    // Only auto-stop if:
    // - Currently connected
    // - Person is NOT detected
    // - Detection is active (not in error state)
    if (
      connectionStatus === 'connected' &&
      !isPersonDetected &&
      isDetectionActive
    ) {
      console.log(`Person left, auto-stopping in ${detectionConfig.stopDelay}ms...`);
      autoStopTimerRef.current = setTimeout(() => {
        console.log('Auto-stopping conversation...');
        handleEndOrder();
      }, detectionConfig.stopDelay);
    }

    return () => {
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
        autoStopTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPersonDetected, connectionStatus, isDetectionActive, detectionConfig.stopDelay]);

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
      // (The server syncs the latest menu prices to the agent before each session)
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
            console.log('🛒 Order update received from agent:', parameters);

            // Parse items if it's a JSON string (due to ElevenLabs tool limitations)
            let items = parameters?.items || [];
            console.log('Items type:', typeof items, 'Value:', items);

            if (typeof items === 'string') {
              try {
                items = JSON.parse(items);
                console.log('Parsed items from JSON string:', items);
              } catch (e) {
                console.error('Failed to parse items:', e);
                items = [];
              }
            }

            // Validate items is an array
            if (!Array.isArray(items)) {
              console.error('Items is not an array:', items);
              items = [];
            }

            // Limit items to reasonable amount (safety check)
            if (items.length > 20) {
              console.warn(`⚠️  ABNORMAL: Agent sent ${items.length} items! Limiting to 20.`);
              console.warn('First 3 items:', items.slice(0, 3));
              console.warn('Last 3 items:', items.slice(-3));
              items = items.slice(0, 20);
            }

            const total = parameters?.total || 0;
            const status = parameters?.status || 'in_progress';

            console.log(`Final order state: ${items.length} items, $${total}, status: ${status}`);
            setOrder({ items, total, status });

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
  // Detection Handlers
  // ---------------------------------------------------------------------------
  const handleToggleDetection = useCallback(() => {
    const newEnabled = !detectionEnabled;
    setDetectionEnabled(newEnabled);
    saveDetectionConfig({ ...detectionConfig, enabled: newEnabled });

    if (newEnabled) {
      startDetection();
    } else {
      stopDetection();
    }
  }, [detectionEnabled, detectionConfig, startDetection, stopDetection]);

  const handleRetryDetection = useCallback(() => {
    stopDetection();
    setTimeout(() => {
      startDetection();
    }, 500);
  }, [startDetection, stopDetection]);

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
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 px-6 py-2 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-9 h-9 bg-gray-900 rounded-lg flex items-center justify-center shadow-md"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">Burger Express</h1>
              <p className="text-[10px] text-gray-500 font-medium">AI-Powered Drive-Thru</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Detection Status Indicator */}
            {connectionStatus === 'idle' && (
              <DetectionStatusIndicator
                isPersonDetected={isPersonDetected}
                detectionConfidence={detectionConfidence}
                isModelLoading={isModelLoading}
                isDetectionActive={isDetectionActive}
                error={detectionError}
                onRetry={handleRetryDetection}
                onToggle={handleToggleDetection}
                enabled={detectionEnabled}
              />
            )}

            {/* Connection Status */}
            {isActive ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-semibold text-green-700">Live</span>
              </motion.div>
            ) : isConnecting ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-50 border border-yellow-200">
                <Loader2 className="w-3 h-3 text-yellow-600 animate-spin" />
                <span className="text-xs font-semibold text-yellow-700">Connecting...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200">
                <WifiOff className="w-3 h-3 text-gray-500" />
                <span className="text-xs font-semibold text-gray-600">Ready</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MAIN */}
      {connectionStatus === 'idle' ? (
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center"
          >
            <motion.div
              className="w-28 h-28 bg-gray-900 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <UtensilsCrossed className="w-14 h-14 text-white" />
            </motion.div>
            <h2 className="text-5xl font-bold text-gray-900 mb-4">
              Welcome to Burger Express
            </h2>
            <p className="text-xl text-gray-600 mb-12 font-medium">Start your order with our AI assistant</p>
            <motion.button
              onClick={handleStartOrder}
              className="bg-gray-900 hover:bg-gray-800 text-white text-xl font-bold px-16 py-6 rounded-2xl shadow-lg transition-colors"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              Start Order
            </motion.button>
          </motion.div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden gap-4 p-3">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-1 flex flex-col min-w-0"
          >
            <MenuDisplay menu={menu} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-80 lg:w-96 flex-shrink-0"
          >
            <OrderPanel order={order} />
          </motion.div>
        </div>
      )}

      {/* FOOTER */}
      {connectionStatus !== 'idle' && (
        <footer className="bg-white border-t border-gray-200 px-6 py-2 shadow-sm">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-6 py-3 mb-4 text-sm text-center font-medium"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {isComplete ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="text-center py-6 px-6 rounded-2xl bg-green-50 border border-green-200"
            >
              <div className="text-4xl mb-3">✓</div>
              <p className="text-3xl font-bold text-green-700 mb-2">Order Complete!</p>
              <p className="text-gray-600 mb-6 text-lg">Please pull forward to the window. Thank you!</p>
              <motion.button
                onClick={handleEndOrder}
                className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3 rounded-xl transition-colors font-semibold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                New Order
              </motion.button>
            </motion.div>
          ) : (
            <div className="space-y-1.5">
              {/* Voice status + visualization */}
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-4">
                  {/* Audio bars left */}
                  <div className="flex items-end gap-1 h-10 w-12 justify-center">
                    {audioLevels.slice(0, 3).map((level, i) => (
                      <motion.div
                        key={`l${i}`}
                        className={`w-1.5 rounded-full ${
                          isSpeaking
                            ? 'bg-gray-700'
                            : isListening
                            ? 'bg-green-500'
                            : 'bg-gray-300'
                        }`}
                        animate={{ height: isActive ? Math.max(4, level * 36) : 4 }}
                        transition={{ duration: 0.1, ease: "easeOut" }}
                      />
                    ))}
                  </div>

                  {/* Mic indicator */}
                  <div className="relative">
                    {isListening && (
                      <motion.div
                        className="absolute inset-0 rounded-full bg-green-500"
                        animate={{ scale: [1, 1.6, 1], opacity: [0.3, 0, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                    )}
                    <motion.div
                      className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg ${
                        isConnecting
                          ? 'bg-gray-500'
                          : isSpeaking
                          ? 'bg-gray-900'
                          : isListening
                          ? 'bg-green-500'
                          : 'bg-gray-400'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      {isConnecting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : isSpeaking ? (
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                        >
                          <Volume2 className="w-5 h-5" />
                        </motion.div>
                      ) : (
                        <Mic className="w-5 h-5" />
                      )}
                    </motion.div>
                  </div>

                  {/* Audio bars right */}
                  <div className="flex items-end gap-1 h-10 w-12 justify-center">
                    {audioLevels.slice(2, 5).map((level, i) => (
                      <motion.div
                        key={`r${i}`}
                        className={`w-1.5 rounded-full ${
                          isSpeaking
                            ? 'bg-gray-700'
                            : isListening
                            ? 'bg-green-500'
                            : 'bg-gray-300'
                        }`}
                        animate={{ height: isActive ? Math.max(4, level * 36) : 4 }}
                        transition={{ duration: 0.1, ease: "easeOut" }}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-xs font-semibold text-gray-700">
                  {isConnecting ? 'Connecting...' : isSpeaking ? '🔊 Speaking' : isListening ? '🎤 Listening' : 'Ready'}
                </p>
              </div>

              {/* Text fallback */}
              <div className="text-center">
                {!showTextInput ? (
                  <motion.button
                    onClick={() => setShowTextInput(true)}
                    className="text-gray-500 hover:text-gray-700 text-sm transition-colors font-medium"
                    whileHover={{ scale: 1.05 }}
                  >
                    or type your order instead
                  </motion.button>
                ) : (
                  <motion.form
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleTextSubmit}
                    className="flex gap-3 max-w-lg mx-auto"
                  >
                    <input
                      type="text"
                      value={textInput}
                      onChange={(e) => { setTextInput(e.target.value); conversationRef.current?.sendUserActivity?.(); }}
                      placeholder="Type your order here..."
                      className="flex-1 bg-white border border-gray-300 rounded-xl px-5 py-3 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition-all"
                      disabled={!isActive}
                      autoFocus
                    />
                    <motion.button
                      type="submit"
                      disabled={!textInput.trim() || !isActive}
                      className="bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:opacity-50 text-white px-5 py-3 rounded-xl transition-colors"
                      whileHover={{ scale: textInput.trim() && isActive ? 1.05 : 1 }}
                      whileTap={{ scale: textInput.trim() && isActive ? 0.95 : 1 }}
                    >
                      <Send className="w-5 h-5" />
                    </motion.button>
                  </motion.form>
                )}
              </div>

              {/* End order */}
              {(isActive || isConnecting) && (
                <div className="text-center pt-2">
                  <motion.button
                    onClick={handleEndOrder}
                    className="flex items-center gap-2 mx-auto text-red-600 hover:text-red-700 text-sm transition-colors font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <PhoneOff className="w-4 h-4" /> End Conversation
                  </motion.button>
                </div>
              )}
            </div>
          )}
        </footer>
      )}

      {/* Camera Preview (Optional) */}
      <CameraPreview
        videoElement={videoElement}
        isPersonDetected={isPersonDetected}
        showPreview={showCameraPreview}
        onTogglePreview={() => setShowCameraPreview(!showCameraPreview)}
      />
    </div>
  );
}
