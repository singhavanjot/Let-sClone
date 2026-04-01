/**
 * useSocket Hook
 * React hook for managing Socket.IO connections
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { socketService } from '../services';
import { useAuthStore } from '../store';

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  
  const token = useAuthStore((state) => state.token);
  const retryTimeoutRef = useRef(null);
  const retryAttemptRef = useRef(0);

  /**
   * Connect to the socket server
   */
  const connect = useCallback(async () => {
    if (!token) {
      setError('No authentication token');
      return false;
    }

    try {
      await socketService.connect(token);
      setIsConnected(true);
      setError(null);
      return true;
    } catch (err) {
      setError(err.message);
      setIsConnected(false);
      return false;
    }
  }, [token]);

  /**
   * Disconnect from the socket server
   */
  const disconnect = useCallback(() => {
    socketService.disconnect();
    setIsConnected(false);
  }, []);

  /**
   * Register device
   */
  const registerDevice = useCallback(async (deviceId) => {
    try {
      await socketService.registerDevice(deviceId);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  /**
   * Subscribe to an event
   */
  const on = useCallback((event, handler) => {
    socketService.on(event, handler);
  }, []);

  /**
   * Unsubscribe from an event
   */
  const off = useCallback((event, handler) => {
    socketService.off(event, handler);
  }, []);

  /**
   * Emit an event
   */
  const emit = useCallback(async (event, data) => {
    try {
      await socketService.emit(event, data);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  // Auto-connect when token is available
  useEffect(() => {
    const clearRetryTimer = () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };

    const scheduleRetry = () => {
      retryAttemptRef.current += 1;
      const delay = Math.min(10000, 1000 * Math.pow(2, retryAttemptRef.current - 1));

      retryTimeoutRef.current = setTimeout(async () => {
        const success = await connect();
        if (!success && token) {
          scheduleRetry();
        }
      }, delay);
    };

    if (!token) {
      clearRetryTimer();
      retryAttemptRef.current = 0;
      disconnect();
      return;
    }

    let isActive = true;

    const initialConnect = async () => {
      const success = await connect();
      if (!success && isActive) {
        scheduleRetry();
      }
    };

    initialConnect();

    return () => {
      isActive = false;
      clearRetryTimer();
    };
  }, [token, connect, disconnect]);

  // Update connection state based on socket events
  useEffect(() => {
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleError = (err) => setError(err.message);

    socketService.on('connect', handleConnect);
    socketService.on('disconnect', handleDisconnect);
    socketService.on('error', handleError);

    return () => {
      socketService.off('connect', handleConnect);
      socketService.off('disconnect', handleDisconnect);
      socketService.off('error', handleError);
    };
  }, []);

  return {
    isConnected,
    error,
    connect,
    disconnect,
    registerDevice,
    on,
    off,
    emit,
    socketService
  };
}

export default useSocket;
