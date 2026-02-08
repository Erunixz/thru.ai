/**
 * Person Detection Helper Utilities
 * Configuration constants and helper functions for camera-based person detection
 */

export const DEFAULT_CONFIG = {
  enabled: true,
  startDelay: 1000,        // 1s delay before auto-start
  stopDelay: 2000,         // 2s delay before auto-stop
  detectionFPS: 3,         // Detections per second
  confidenceThreshold: 0.65, // Minimum confidence for person detection
  maxInferenceTime: 500,   // Max inference time before reducing FPS (ms)
  minFPS: 1,               // Minimum FPS when performance is poor
  maxFPS: 5,               // Maximum FPS
};

export const DETECTION_STATES = {
  IDLE: 'idle',
  INITIALIZING: 'initializing',
  READY: 'ready',
  DETECTING: 'detecting',
  ERROR: 'error',
};

export const ERROR_TYPES = {
  CAMERA_PERMISSION_DENIED: 'camera_permission_denied',
  CAMERA_NOT_AVAILABLE: 'camera_not_available',
  MODEL_LOAD_FAILED: 'model_load_failed',
  DETECTION_FAILED: 'detection_failed',
  PERFORMANCE_ISSUE: 'performance_issue',
};

export const ERROR_MESSAGES = {
  [ERROR_TYPES.CAMERA_PERMISSION_DENIED]: 'Camera access required for auto-detection. Please allow camera permission.',
  [ERROR_TYPES.CAMERA_NOT_AVAILABLE]: 'No camera found. Auto-detection disabled.',
  [ERROR_TYPES.MODEL_LOAD_FAILED]: 'Failed to load detection model. Please refresh the page.',
  [ERROR_TYPES.DETECTION_FAILED]: 'Detection error occurred. Retrying...',
  [ERROR_TYPES.PERFORMANCE_ISSUE]: 'Performance issue detected. Reducing detection rate.',
};

/**
 * Get detection configuration from localStorage with defaults
 */
export const getDetectionConfig = () => {
  try {
    const stored = localStorage.getItem('detectionConfig');
    if (stored) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.warn('Failed to load detection config from localStorage:', error);
  }
  return DEFAULT_CONFIG;
};

/**
 * Save detection configuration to localStorage
 */
export const saveDetectionConfig = (config) => {
  try {
    localStorage.setItem('detectionConfig', JSON.stringify(config));
  } catch (error) {
    console.warn('Failed to save detection config to localStorage:', error);
  }
};

/**
 * Check if browser supports required features
 */
export const checkBrowserSupport = () => {
  const hasCamera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const hasWebGL = (() => {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {
      return false;
    }
  })();

  return {
    hasCamera,
    hasWebGL,
    isSupported: hasCamera && hasWebGL,
  };
};

/**
 * Calculate optimal FPS based on inference time
 */
export const calculateOptimalFPS = (inferenceTime, currentFPS, config = DEFAULT_CONFIG) => {
  if (inferenceTime > config.maxInferenceTime && currentFPS > config.minFPS) {
    return Math.max(currentFPS - 1, config.minFPS);
  }
  if (inferenceTime < config.maxInferenceTime / 2 && currentFPS < config.maxFPS) {
    return Math.min(currentFPS + 1, config.maxFPS);
  }
  return currentFPS;
};

/**
 * Filter person detections from COCO-SSD predictions
 */
export const filterPersonDetections = (predictions, confidenceThreshold = DEFAULT_CONFIG.confidenceThreshold) => {
  return predictions.filter(
    prediction => prediction.class === 'person' && prediction.score >= confidenceThreshold
  );
};

/**
 * Get highest confidence person detection
 */
export const getHighestConfidencePerson = (personDetections) => {
  if (personDetections.length === 0) return null;
  return personDetections.reduce((highest, current) =>
    current.score > highest.score ? current : highest
  );
};

/**
 * Request camera permission
 */
export const requestCameraPermission = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 480 },
      }
    });
    return { success: true, stream };
  } catch (error) {
    console.error('Camera permission error:', error);

    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      return { success: false, error: ERROR_TYPES.CAMERA_PERMISSION_DENIED };
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      return { success: false, error: ERROR_TYPES.CAMERA_NOT_AVAILABLE };
    }

    return { success: false, error: ERROR_TYPES.CAMERA_NOT_AVAILABLE };
  }
};

/**
 * Stop camera stream
 */
export const stopCameraStream = (stream) => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
};

/**
 * Format confidence as percentage
 */
export const formatConfidence = (confidence) => {
  return `${Math.round(confidence * 100)}%`;
};

/**
 * Debounce helper for detection events
 */
export const createDebouncer = () => {
  let timeoutId = null;

  return {
    debounce: (callback, delay) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(callback, delay);
    },
    clear: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    },
  };
};
