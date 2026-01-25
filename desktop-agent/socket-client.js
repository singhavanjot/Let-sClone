/**
 * Socket Client for Desktop Agent
 * Connects to the Let's Clone server to receive control events
 */

const { io } = require('socket.io-client');
const EventEmitter = require('events');

class SocketClient extends EventEmitter {
  constructor(serverUrl, token) {
    super();
    this.serverUrl = serverUrl;
    this.token = token;
    this.socket = null;
    this.sessionCode = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
  }

  /**
   * Connect to the server
   */
  connect() {
    console.log(`[SocketClient] Connecting to ${this.serverUrl}...`);

    // Ensure URL doesn't have trailing slash
    const cleanUrl = this.serverUrl.replace(/\/$/, '');
    console.log('[SocketClient] Clean URL:', cleanUrl);
    console.log('[SocketClient] Token present:', !!this.token);
    
    this.socket = io(cleanUrl, {
      auth: {
        token: this.token
      },
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: true
    });

    console.log('[SocketClient] Socket created, setting up handlers...');
    this.setupEventHandlers();
  }

  /**
   * Set up socket event handlers
   */
  setupEventHandlers() {
    this.socket.on('connect', () => {
      console.log('[SocketClient] ✓ Connected to server! Socket ID:', this.socket.id);
      this.reconnectAttempts = 0;
      this.emit('connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[SocketClient] ✗ Disconnected:', reason);
      this.emit('disconnected', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[SocketClient] ✗ Connection error:', error.message);
      this.reconnectAttempts++;
      this.emit('error', { message: `Connection failed: ${error.message}` });
    });

    // Handle control events from the server
    this.socket.on('control:event', (data) => {
      const { event, fromViewer } = data;
      console.log('[SocketClient] >>> Control event received:', event.type, 'from:', fromViewer);
      this.emit('control-event', event);
    });

    // Handle agent-specific events
    this.socket.on('agent:registered', (data) => {
      console.log('[SocketClient] ✓ Agent registered:', data);
      this.emit('agent-registered', data);
    });

    this.socket.on('session:state-changed', (data) => {
      console.log('[SocketClient] Session state changed:', data.state);
      this.emit('session-state-changed', data);
    });

    this.socket.on('session:ended', () => {
      console.log('[SocketClient] Session ended');
      this.emit('session-ended');
      this.sessionCode = null;
    });

    this.socket.on('error', (error) => {
      console.error('[SocketClient] ✗ Server error:', error);
      this.emit('error', error);
    });

    // Handle control mode changes
    this.socket.on('control-mode-change', (data) => {
      console.log('[SocketClient] Control mode changed:', data.controlMode);
      this.emit('control-mode-change', data);
    });
  }

  /**
   * Join a session as a desktop agent
   */
  joinAsAgent(sessionCode) {
    if (!this.socket?.connected) {
      console.error('Not connected to server');
      return;
    }

    this.sessionCode = sessionCode;
    
    // Register as a desktop agent for this session
    this.socket.emit('agent:register', {
      sessionCode,
      agentType: 'desktop-control',
      capabilities: ['mouse', 'keyboard', 'scroll']
    });

    console.log('Joining session as agent:', sessionCode);
  }

  /**
   * Send status update to server
   */
  sendStatus(status) {
    if (this.socket?.connected && this.sessionCode) {
      this.socket.emit('agent:status', {
        sessionCode: this.sessionCode,
        status
      });
    }
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.sessionCode = null;
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.socket?.connected || false;
  }
}

module.exports = { SocketClient };
