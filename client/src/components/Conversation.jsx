// =============================================================================
// client/src/components/Conversation.jsx — Chat Transcript Panel
// =============================================================================
//
// PURPOSE:
//   Displays the conversation between the customer and the AI assistant
//   as a scrollable chat transcript. Messages appear in real-time with
//   smooth animations.
//
// LAYOUT:
//   - Customer messages: aligned right, blue background
//   - AI messages: aligned left, dark background
//   - Auto-scrolls to the latest message
//   - Shows timestamp for each message
//
// PROPS:
//   messages: Array of { role: "user"|"assistant", text: string, timestamp: Date }
//
// =============================================================================

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Bot } from 'lucide-react';

export default function Conversation({ messages }) {
  // Ref to the bottom of the message list (for auto-scrolling)
  const bottomRef = useRef(null);

  // Auto-scroll to the bottom whenever a new message appears
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
      {/* Empty state — before conversation starts */}
      {messages.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <Bot className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-xl font-medium">Welcome to Burger Express</p>
          <p className="text-base mt-2">Tap the microphone to start your order</p>
        </div>
      )}

      {/* Message list */}
      <AnimatePresence mode="popLayout">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar icon */}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isUser
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-brand-500/20 text-brand-400'
                }`}
              >
                {isUser ? (
                  <User className="w-5 h-5" />
                ) : (
                  <Bot className="w-5 h-5" />
                )}
              </div>

              {/* Message bubble */}
              <div
                className={`max-w-[75%] rounded-2xl px-5 py-3 ${
                  isUser
                    ? 'bg-blue-600/30 text-blue-100 rounded-tr-sm'
                    : 'bg-slate-700/50 text-slate-200 rounded-tl-sm'
                }`}
              >
                {/* Message text — large and readable (drive-thru screen) */}
                <p className="text-base leading-relaxed">{msg.text}</p>

                {/* Timestamp */}
                <p
                  className={`text-xs mt-1.5 ${
                    isUser ? 'text-blue-400/50' : 'text-slate-500'
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Invisible anchor for auto-scroll */}
      <div ref={bottomRef} />
    </div>
  );
}
