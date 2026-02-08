import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Optional camera preview with bounding boxes for detected persons
 *
 * @param {Object} props
 * @param {MediaStream} props.cameraStream - Camera stream to display
 * @param {HTMLVideoElement} props.videoElement - Video element being processed
 * @param {boolean} props.isPersonDetected - Whether person is detected
 * @param {boolean} props.showPreview - Whether to show the preview
 * @param {Function} props.onTogglePreview - Callback to toggle preview visibility
 */
export const CameraPreview = ({
  cameraStream,
  videoElement,
  isPersonDetected,
  showPreview = false,
  onTogglePreview,
}) => {
  const canvasRef = useRef(null);
  const [isMinimized, setIsMinimized] = useState(true);

  useEffect(() => {
    if (!showPreview || !canvasRef.current || !videoElement) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const updateCanvas = () => {
      if (!videoElement || videoElement.readyState < 2) return;

      // Set canvas size to match video
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;

      // Draw video frame
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      // Draw detection indicator if person detected
      if (isPersonDetected) {
        // Draw green border
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 4;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);

        // Draw detection label
        ctx.fillStyle = '#10b981';
        ctx.fillRect(10, 10, 120, 30);
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px sans-serif';
        ctx.fillText('Person Detected', 20, 30);
      }
    };

    // Update canvas every 200ms (5 FPS for preview)
    const interval = setInterval(updateCanvas, 200);

    return () => clearInterval(interval);
  }, [videoElement, isPersonDetected, showPreview]);

  if (!showPreview) {
    return (
      <motion.button
        onClick={onTogglePreview}
        className="fixed bottom-4 right-4 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-full text-white text-sm font-medium transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        📷 Show Camera Preview
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className={`fixed ${isMinimized ? 'bottom-4 right-4' : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'} z-50 transition-all duration-300`}
      >
        <div className="bg-black/90 rounded-lg shadow-2xl overflow-hidden border border-white/20">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-white/10 border-b border-white/20">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isPersonDetected ? 'bg-green-500' : 'bg-gray-400'} animate-pulse`} />
              <span className="text-xs font-medium text-white">Camera Preview</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
                title={isMinimized ? 'Maximize' : 'Minimize'}
              >
                <span className="text-white text-xs">
                  {isMinimized ? '⬜' : '▫️'}
                </span>
              </button>

              <button
                onClick={onTogglePreview}
                className="p-1 hover:bg-white/10 rounded transition-colors"
                title="Close preview"
              >
                <span className="text-white text-xs">✕</span>
              </button>
            </div>
          </div>

          {/* Canvas */}
          <canvas
            ref={canvasRef}
            className={isMinimized ? 'w-40 h-30' : 'w-96 h-72'}
            style={{ imageRendering: 'auto' }}
          />

          {/* Footer */}
          <div className="px-3 py-2 bg-white/5 border-t border-white/10">
            <p className="text-xs text-white/60 text-center">
              Privacy: Video processed locally, never saved
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CameraPreview;
