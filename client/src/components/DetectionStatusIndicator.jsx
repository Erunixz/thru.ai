import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ERROR_MESSAGES, ERROR_TYPES, formatConfidence } from '../utils/personDetectionHelper';

/**
 * Visual indicator showing person detection status
 *
 * @param {Object} props
 * @param {boolean} props.isPersonDetected - Whether a person is detected
 * @param {number} props.detectionConfidence - Detection confidence (0-1)
 * @param {boolean} props.isModelLoading - Whether model is loading
 * @param {boolean} props.isDetectionActive - Whether detection is active
 * @param {string} props.error - Error type if any
 * @param {Function} props.onRetry - Callback for retry action
 * @param {Function} props.onToggle - Callback to toggle detection
 * @param {boolean} props.enabled - Whether detection is enabled
 */
export const DetectionStatusIndicator = ({
  isPersonDetected,
  detectionConfidence,
  isModelLoading,
  isDetectionActive,
  error,
  onRetry,
  onToggle,
  enabled,
}) => {
  const getStatusConfig = () => {
    if (error) {
      return {
        color: 'bg-red-500',
        icon: '⚠️',
        text: ERROR_MESSAGES[error] || 'Detection error',
        showRetry: error !== ERROR_TYPES.CAMERA_NOT_AVAILABLE,
      };
    }

    if (isModelLoading) {
      return {
        color: 'bg-yellow-500',
        icon: '⏳',
        text: 'Loading detection model...',
        showRetry: false,
      };
    }

    if (!enabled || !isDetectionActive) {
      return {
        color: 'bg-gray-400',
        icon: '⏸️',
        text: 'Auto-detection disabled',
        showRetry: false,
      };
    }

    if (isPersonDetected) {
      return {
        color: 'bg-green-500',
        icon: '👤',
        text: `Customer detected (${formatConfidence(detectionConfidence)})`,
        showRetry: false,
      };
    }

    return {
      color: 'bg-blue-500',
      icon: '📷',
      text: 'Camera ready - step closer to begin',
      showRetry: false,
    };
  };

  const status = getStatusConfig();

  return (
    <div className="flex items-center gap-3">
      <AnimatePresence mode="wait">
        <motion.div
          key={status.text}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20"
        >
          {/* Pulse animation for active detection */}
          {isDetectionActive && !error && !isModelLoading && (
            <motion.div
              className={`w-2 h-2 rounded-full ${status.color}`}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [1, 0.7, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}

          {/* Status icon */}
          <span className="text-lg">{status.icon}</span>

          {/* Status text */}
          <span className="text-sm font-medium text-white">
            {status.text}
          </span>

          {/* Retry button */}
          {status.showRetry && onRetry && (
            <motion.button
              onClick={onRetry}
              className="ml-2 px-3 py-1 text-xs font-medium text-white bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Retry
            </motion.button>
          )}

          {/* Toggle button */}
          {onToggle && !error && !isModelLoading && (
            <motion.button
              onClick={onToggle}
              className="ml-2 px-3 py-1 text-xs font-medium text-white bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={enabled && isDetectionActive ? 'Disable auto-detection' : 'Enable auto-detection'}
            >
              {enabled && isDetectionActive ? 'Disable' : 'Enable'}
            </motion.button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default DetectionStatusIndicator;
