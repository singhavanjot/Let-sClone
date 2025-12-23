/**
 * useRemoteControl Hook
 * React hook for handling remote control events
 */

import { useRef, useCallback, useEffect, useState } from 'react';
import { RemoteControlHandler } from '../webrtc/controlHandler';

export function useRemoteControl(options = {}) {
  const [isEnabled, setIsEnabled] = useState(options.enabled ?? true);
  const [videoSize, setVideoSize] = useState({ width: 1920, height: 1080 });
  
  const controlHandlerRef = useRef(null);
  const containerRef = useRef(null);

  /**
   * Initialize the control handler
   */
  const initialize = useCallback((containerElement, onControlEvent) => {
    if (controlHandlerRef.current) {
      controlHandlerRef.current.stop();
    }

    containerRef.current = containerElement;

    controlHandlerRef.current = new RemoteControlHandler({
      targetElement: containerElement,
      videoWidth: videoSize.width,
      videoHeight: videoSize.height,
      onControlEvent
    });

    if (isEnabled) {
      controlHandlerRef.current.start();
    }
  }, [videoSize, isEnabled]);

  /**
   * Update video dimensions
   */
  const updateVideoSize = useCallback((width, height) => {
    setVideoSize({ width, height });
    
    if (controlHandlerRef.current) {
      controlHandlerRef.current.updateVideoDimensions(width, height);
    }
  }, []);

  /**
   * Enable/disable control
   */
  const setEnabled = useCallback((enabled) => {
    setIsEnabled(enabled);
    
    if (controlHandlerRef.current) {
      controlHandlerRef.current.setEnabled(enabled);
    }
  }, []);

  /**
   * Start capturing events
   */
  const start = useCallback(() => {
    if (controlHandlerRef.current) {
      controlHandlerRef.current.start();
    }
  }, []);

  /**
   * Stop capturing events
   */
  const stop = useCallback(() => {
    if (controlHandlerRef.current) {
      controlHandlerRef.current.stop();
    }
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (controlHandlerRef.current) {
        controlHandlerRef.current.stop();
        controlHandlerRef.current = null;
      }
    };
  }, []);

  return {
    isEnabled,
    videoSize,
    initialize,
    updateVideoSize,
    setEnabled,
    start,
    stop,
    containerRef
  };
}

export default useRemoteControl;
