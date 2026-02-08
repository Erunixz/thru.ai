import { useState, useEffect, useRef, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import {
  DEFAULT_CONFIG,
  getDetectionConfig,
  checkBrowserSupport,
  requestCameraPermission,
  stopCameraStream,
  filterPersonDetections,
  getHighestConfidencePerson,
  calculateOptimalFPS,
  ERROR_TYPES,
} from '../utils/personDetectionHelper';

/**
 * Custom hook for camera-based person detection using TensorFlow.js and COCO-SSD
 *
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoStart - Whether to start detection automatically
 * @param {number} options.fps - Detection frames per second
 * @param {number} options.confidenceThreshold - Minimum confidence for detection
 *
 * @returns {Object} Detection state and controls
 */
export const usePersonDetection = (options = {}) => {
  const config = { ...getDetectionConfig(), ...options };

  const [isPersonDetected, setIsPersonDetected] = useState(false);
  const [detectionConfidence, setDetectionConfidence] = useState(0);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [isDetectionActive, setIsDetectionActive] = useState(false);
  const [error, setError] = useState(null);
  const [currentFPS, setCurrentFPS] = useState(config.detectionFPS);

  const modelRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const videoRef = useRef(null);
  const detectionLoopRef = useRef(null);
  const retryCountRef = useRef(0);
  const lastInferenceTimeRef = useRef(0);

  /**
   * Initialize TensorFlow.js backend
   */
  const initializeTensorFlow = useCallback(async () => {
    try {
      await tf.ready();
      await tf.setBackend('webgl');
      console.log('TensorFlow.js initialized with WebGL backend');
      return true;
    } catch (error) {
      console.error('TensorFlow.js initialization failed:', error);
      setError(ERROR_TYPES.MODEL_LOAD_FAILED);
      return false;
    }
  }, []);

  /**
   * Load COCO-SSD model
   */
  const loadModel = useCallback(async () => {
    if (modelRef.current) return modelRef.current;

    setIsModelLoading(true);
    setError(null);

    try {
      const tfReady = await initializeTensorFlow();
      if (!tfReady) {
        throw new Error('TensorFlow.js initialization failed');
      }

      console.log('Loading COCO-SSD model...');
      const model = await cocoSsd.load({
        base: 'lite_mobilenet_v2', // Lighter model for better performance
      });

      modelRef.current = model;
      console.log('COCO-SSD model loaded successfully');
      setIsModelLoading(false);
      retryCountRef.current = 0;
      return model;
    } catch (error) {
      console.error('Model loading failed:', error);
      setIsModelLoading(false);
      setError(ERROR_TYPES.MODEL_LOAD_FAILED);

      // Retry once after 3 seconds
      if (retryCountRef.current < 1) {
        retryCountRef.current++;
        console.log('Retrying model load in 3 seconds...');
        setTimeout(() => loadModel(), 3000);
      }

      return null;
    }
  }, [initializeTensorFlow]);

  /**
   * Initialize camera stream
   */
  const initializeCamera = useCallback(async () => {
    const support = checkBrowserSupport();
    if (!support.isSupported) {
      setError(ERROR_TYPES.CAMERA_NOT_AVAILABLE);
      return null;
    }

    const result = await requestCameraPermission();
    if (!result.success) {
      setError(result.error);
      return null;
    }

    cameraStreamRef.current = result.stream;

    // Create video element for processing
    if (!videoRef.current) {
      videoRef.current = document.createElement('video');
      videoRef.current.autoplay = true;
      videoRef.current.playsInline = true;
    }

    videoRef.current.srcObject = result.stream;

    return new Promise((resolve) => {
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play();
        console.log('Camera initialized successfully');
        resolve(videoRef.current);
      };
    });
  }, []);

  /**
   * Run person detection on current video frame
   */
  const detectPerson = useCallback(async () => {
    if (!modelRef.current || !videoRef.current || videoRef.current.readyState < 2) {
      return;
    }

    try {
      const startTime = performance.now();

      // Run detection
      const predictions = await modelRef.current.detect(videoRef.current);

      const inferenceTime = performance.now() - startTime;
      lastInferenceTimeRef.current = inferenceTime;

      // Filter for person detections
      const personDetections = filterPersonDetections(predictions, config.confidenceThreshold);

      if (personDetections.length > 0) {
        const highestConfidence = getHighestConfidencePerson(personDetections);
        setIsPersonDetected(true);
        setDetectionConfidence(highestConfidence.score);
      } else {
        setIsPersonDetected(false);
        setDetectionConfidence(0);
      }

      // Auto-adjust FPS based on performance
      const optimalFPS = calculateOptimalFPS(inferenceTime, currentFPS, config);
      if (optimalFPS !== currentFPS) {
        console.log(`Adjusting FPS: ${currentFPS} -> ${optimalFPS} (inference: ${inferenceTime.toFixed(0)}ms)`);
        setCurrentFPS(optimalFPS);
        if (inferenceTime > config.maxInferenceTime) {
          setError(ERROR_TYPES.PERFORMANCE_ISSUE);
          setTimeout(() => setError(null), 3000); // Clear warning after 3s
        }
      }
    } catch (error) {
      console.error('Detection error:', error);
      setError(ERROR_TYPES.DETECTION_FAILED);
      setTimeout(() => setError(null), 2000); // Clear error after 2s
    }
  }, [config.confidenceThreshold, config.maxInferenceTime, currentFPS]);

  /**
   * Start detection loop
   */
  const startDetection = useCallback(async () => {
    if (isDetectionActive) return;

    console.log('Starting person detection...');
    setError(null);

    // Load model if not loaded
    if (!modelRef.current) {
      const model = await loadModel();
      if (!model) return;
    }

    // Initialize camera if not initialized
    if (!cameraStreamRef.current) {
      const video = await initializeCamera();
      if (!video) return;
    }

    setIsDetectionActive(true);

    // Start detection loop
    const runDetectionLoop = () => {
      if (!isDetectionActive && detectionLoopRef.current) return;

      detectPerson();

      const intervalTime = 1000 / currentFPS;
      detectionLoopRef.current = setTimeout(runDetectionLoop, intervalTime);
    };

    runDetectionLoop();
  }, [isDetectionActive, loadModel, initializeCamera, detectPerson, currentFPS]);

  /**
   * Stop detection loop
   */
  const stopDetection = useCallback(() => {
    console.log('Stopping person detection...');
    setIsDetectionActive(false);

    if (detectionLoopRef.current) {
      clearTimeout(detectionLoopRef.current);
      detectionLoopRef.current = null;
    }

    setIsPersonDetected(false);
    setDetectionConfidence(0);
  }, []);

  /**
   * Toggle detection on/off
   */
  const toggleDetection = useCallback(() => {
    if (isDetectionActive) {
      stopDetection();
    } else {
      startDetection();
    }
  }, [isDetectionActive, startDetection, stopDetection]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopDetection();

      if (cameraStreamRef.current) {
        stopCameraStream(cameraStreamRef.current);
        cameraStreamRef.current = null;
      }

      if (modelRef.current) {
        modelRef.current.dispose();
        modelRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current = null;
      }
    };
  }, [stopDetection]);

  /**
   * Auto-start if enabled
   */
  useEffect(() => {
    if (config.autoStart && config.enabled) {
      startDetection();
    }
  }, [config.autoStart, config.enabled, startDetection]);

  /**
   * Update detection loop when FPS changes
   */
  useEffect(() => {
    if (isDetectionActive) {
      // Restart loop with new FPS
      if (detectionLoopRef.current) {
        clearTimeout(detectionLoopRef.current);
        detectionLoopRef.current = null;
      }

      const runDetectionLoop = () => {
        if (!isDetectionActive) return;

        detectPerson();

        const intervalTime = 1000 / currentFPS;
        detectionLoopRef.current = setTimeout(runDetectionLoop, intervalTime);
      };

      runDetectionLoop();
    }
  }, [currentFPS, isDetectionActive, detectPerson]);

  return {
    isPersonDetected,
    detectionConfidence,
    isModelLoading,
    isDetectionActive,
    error,
    cameraStream: cameraStreamRef.current,
    videoElement: videoRef.current,
    currentFPS,
    startDetection,
    stopDetection,
    toggleDetection,
    lastInferenceTime: lastInferenceTimeRef.current,
  };
};
