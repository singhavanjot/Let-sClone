/**
 * Socket Service
 * Socket.IO client for real-time signaling
 */

import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventHandlers = new Map();
  }

  /**
   * Connect to the signaling server
   * @param {string} token - JWT authentication token
   * @returns {Promise} Resolves when connected
   */
  connect(token) {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve(this.socket);
        return;
      }

      this.socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000
      });

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket.id);
        this.isConnected = true;
        resolve(this.socket);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
        this.isConnected = false;
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        this.isConnected = false;
      });

      this.socket.on('reconnect', (attemptNumber) => {
        console.log('Socket reconnected after', attemptNumber, 'attempts');
        this.isConnected = true;
      });

      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    });
  }

  /**
   * Disconnect from the server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Register a device with the signaling server
   * @param {string} deviceId - Device ID to register
   */
  registerDevice(deviceId) {
    return this.emit('device:register', { deviceId });
  }

  /**
   * Create a session room (host)
   * @param {string} sessionCode - Session code
   */
  createSession(sessionCode) {
    return this.emit('session:create', { sessionCode });
  }

  /**
   * Join a session room (viewer)
   * @param {string} sessionCode - Session code
   */
  joinSession(sessionCode) {
    return this.emit('session:join', { sessionCode });
  }

  /**
   * Send WebRTC offer
   * @param {string} sessionCode - Session code
   * @param {RTCSessionDescriptionInit} offer - SDP offer
   */
  sendOffer(sessionCode, offer) {
    return this.emit('webrtc:offer', { sessionCode, offer });
  }

  /**
   * Send WebRTC answer
   * @param {string} sessionCode - Session code
   * @param {RTCSessionDescriptionInit} answer - SDP answer
   */
  sendAnswer(sessionCode, answer) {
    return this.emit('webrtc:answer', { sessionCode, answer });
  }

  /**
   * Send ICE candidate
   * @param {string} sessionCode - Session code
   * @param {RTCIceCandidate} candidate - ICE candidate
   */
  sendIceCandidate(sessionCode, candidate) {
    return this.emit('webrtc:ice-candidate', { sessionCode, candidate });
  }

  /**
   * Send connection state update
   * @param {string} sessionCode - Session code
   * @param {string} state - Connection state
   */
  sendConnectionState(sessionCode, state) {
    return this.emit('webrtc:connection-state', { sessionCode, state });
  }

  /**
   * Send control event (mouse/keyboard)
   * @param {string} sessionCode - Session code
   * @param {Object} event - Control event data
   */
  sendControlEvent(sessionCode, event) {
    return this.emit('control:event', { sessionCode, event });
  }

  /**
   * Forward control event to desktop agent
   * @param {string} sessionCode - Session code
   * @param {Object} event - Control event data
   */
  forwardToAgent(sessionCode, event) {
    return this.emit('control:forward-to-agent', { sessionCode, event });
  }

  /**
   * End session
   * @param {string} sessionCode - Session code
   */
  endSession(sessionCode) {
    return this.emit('session:end', { sessionCode });
  }

  /**
   * Send chat message
   * @param {string} sessionCode - Session code
   * @param {string} message - Message content
   */
  sendChatMessage(sessionCode, message) {
    return this.emit('chat:message', { sessionCode, message });
  }

  /**
   * Emit event to server
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  emit(event, data) {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit(event, data);
      resolve();
    });
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   */
  on(event, handler) {
    if (!this.socket) {
      console.warn('Socket not initialized');
      return;
    }

    // Store handler for cleanup
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);

    this.socket.on(event, handler);
  }

  /**
   * Subscribe to an event once
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   */
  once(event, handler) {
    if (!this.socket) {
      console.warn('Socket not initialized');
      return;
    }

    // Store handler for cleanup (optional, but consistent with 'on')
    // For 'once', socket.io handles removal, but we might want to track it if we want to support manual removal before it fires.
    // However, simplest fix for now is just delegation.

    this.socket.once(event, handler);
  }

  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {Function} handler - Event handler (optional, removes all if not provided)
   */
  off(event, handler) {
    if (!this.socket) return;

    if (handler) {
      this.socket.off(event, handler);
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) handlers.splice(index, 1);
      }
    } else {
      // Remove all handlers for this event
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        handlers.forEach((h) => this.socket.off(event, h));
        this.eventHandlers.delete(event);
      }
    }
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners() {
    this.eventHandlers.forEach((handlers, event) => {
      handlers.forEach((handler) => this.socket?.off(event, handler));
    });
    this.eventHandlers.clear();
  }

  /**
   * Get socket ID
   */
  getSocketId() {
    return this.socket?.id;
  }

  /**
   * Check if connected
   */
  isSocketConnected() {
    return this.socket?.connected ?? false;
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;
