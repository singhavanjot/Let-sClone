/**
 * WebRTC Signaling Server
 * Socket.IO based signaling for WebRTC peer connections
 */

const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const webrtcConfig = require('../config/webrtc');
const { User, Device, Session } = require('../models');
const logger = require('../utils/logger');

// Store active connections
const connectedClients = new Map();
const sessionRooms = new Map();

/**
 * Initialize Socket.IO signaling server
 * @param {Object} server - HTTP server instance
 */
const initializeSocketServer = (server) => {
  // Get allowed origins from env or use defaults
  const allowedOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
    : ['http://localhost:5173', 'http://localhost:5174'];
  
  const io = socketIO(server, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (desktop apps, curl, etc)
        if (!origin) return callback(null, true);
        // Allow listed origins
        if (allowedOrigins.some(o => origin.startsWith(o) || o === '*')) {
          return callback(null, true);
        }
        // Allow Vercel and Render domains
        if (origin.includes('vercel.app') || origin.includes('onrender.com')) {
          return callback(null, true);
        }
        callback(new Error('CORS not allowed'));
      },
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['polling', 'websocket']
  });

  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }
      
      const decoded = jwt.verify(token, jwtConfig.secret, {
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience
      });
      
      const user = await User.findById(decoded.userId);
      
      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }
      
      socket.userId = decoded.userId;
      socket.user = user;
      
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error.message);
      next(new Error('Invalid token'));
    }
  });

  // Handle new connections
  io.on('connection', async (socket) => {
    logger.info(`Client connected: ${socket.id} (User: ${socket.user.email})`);
    
    // Store client info
    connectedClients.set(socket.id, {
      socketId: socket.id,
      userId: socket.userId,
      email: socket.user.email,
      connectedAt: new Date()
    });

    // Send WebRTC configuration to client
    socket.emit('config', {
      iceServers: webrtcConfig.iceServers
    });

    /**
     * Register device as online
     */
    socket.on('device:register', async (data) => {
      try {
        const { deviceId } = data;
        
        const device = await Device.findOne({
          deviceId,
          userId: socket.userId,
          isActive: true
        });
        
        if (!device) {
          return socket.emit('error', { message: 'Device not found' });
        }
        
        // Update device status
        await device.goOnline(socket.id, socket.handshake.address);
        
        // Store device info in socket
        socket.deviceId = deviceId;
        socket.device = device;
        
        socket.emit('device:registered', {
          deviceId,
          status: 'online'
        });
        
        logger.info(`Device registered: ${deviceId}`);
        
      } catch (error) {
        logger.error('Device registration error:', error);
        socket.emit('error', { message: 'Failed to register device' });
      }
    });

    /**
     * Create a new session room
     */
    socket.on('session:create', async (data) => {
      try {
        const { sessionCode } = data;
        
        const session = await Session.findActiveByCode(sessionCode);
        
        if (!session) {
          return socket.emit('error', { message: 'Session not found' });
        }
        
        // Verify caller is the host
        if (session.hostUser._id.toString() !== socket.userId) {
          return socket.emit('error', { message: 'Only the host can create session room' });
        }
        
        // Join the session room
        socket.join(`session:${sessionCode}`);
        
        // Store session info
        sessionRooms.set(sessionCode, {
          hostSocketId: socket.id,
          viewerSocketId: null,
          sessionId: session._id,
          controlMode: 'full-control', // Default to full control
          createdAt: new Date()
        });
        
        socket.sessionCode = sessionCode;
        socket.isHost = true;
        
        socket.emit('session:created', {
          sessionCode,
          message: 'Waiting for viewer to join'
        });
        
        logger.info(`Session room created: ${sessionCode}`);
        
      } catch (error) {
        logger.error('Session creation error:', error);
        socket.emit('error', { message: 'Failed to create session' });
      }
    });

    /**
     * Join an existing session room
     */
    socket.on('session:join', async (data) => {
      try {
        const { sessionCode } = data;
        
        const session = await Session.findActiveByCode(sessionCode);
        
        if (!session) {
          return socket.emit('error', { message: 'Session not found or expired' });
        }
        
        const sessionRoom = sessionRooms.get(sessionCode);
        
        if (!sessionRoom) {
          return socket.emit('error', { message: 'Host is not connected. Please wait.' });
        }
        
        // Check if viewer slot is already taken
        if (sessionRoom.viewerSocketId) {
          return socket.emit('error', { message: 'Session already has a viewer' });
        }
        
        // Join the session room
        socket.join(`session:${sessionCode}`);
        
        // Update session room
        sessionRoom.viewerSocketId = socket.id;
        sessionRooms.set(sessionCode, sessionRoom);
        
        socket.sessionCode = sessionCode;
        socket.isHost = false;
        
        // Notify host that viewer joined
        io.to(sessionRoom.hostSocketId).emit('viewer:joined', {
          viewerId: socket.userId,
          viewerEmail: socket.user.email
        });
        
        socket.emit('session:joined', {
          sessionCode,
          hostSocketId: sessionRoom.hostSocketId,
          message: 'Connected to session'
        });
        
        // Update session in database
        await session.startSession(socket.userId, socket.device?._id);
        
        logger.info(`Viewer joined session: ${sessionCode}`);
        
      } catch (error) {
        logger.error('Session join error:', error);
        socket.emit('error', { message: 'Failed to join session' });
      }
    });

    /**
     * WebRTC Signaling: Handle offer from host
     */
    socket.on('webrtc:offer', async (data) => {
      try {
        const { sessionCode, offer } = data;
        
        const sessionRoom = sessionRooms.get(sessionCode);
        
        if (!sessionRoom) {
          return socket.emit('error', { message: 'Session not found' });
        }
        
        // Only host can send offer
        if (socket.id !== sessionRoom.hostSocketId) {
          return socket.emit('error', { message: 'Only host can send offer' });
        }
        
        // Forward offer to viewer
        if (sessionRoom.viewerSocketId) {
          io.to(sessionRoom.viewerSocketId).emit('webrtc:offer', {
            offer,
            hostSocketId: socket.id
          });
          
          logger.debug(`Offer forwarded to viewer in session: ${sessionCode}`);
        }
        
      } catch (error) {
        logger.error('WebRTC offer error:', error);
        socket.emit('error', { message: 'Failed to send offer' });
      }
    });

    /**
     * WebRTC Signaling: Handle answer from viewer
     */
    socket.on('webrtc:answer', async (data) => {
      try {
        const { sessionCode, answer } = data;
        
        const sessionRoom = sessionRooms.get(sessionCode);
        
        if (!sessionRoom) {
          return socket.emit('error', { message: 'Session not found' });
        }
        
        // Only viewer can send answer
        if (socket.id !== sessionRoom.viewerSocketId) {
          return socket.emit('error', { message: 'Only viewer can send answer' });
        }
        
        // Forward answer to host
        io.to(sessionRoom.hostSocketId).emit('webrtc:answer', {
          answer,
          viewerSocketId: socket.id
        });
        
        logger.debug(`Answer forwarded to host in session: ${sessionCode}`);
        
      } catch (error) {
        logger.error('WebRTC answer error:', error);
        socket.emit('error', { message: 'Failed to send answer' });
      }
    });

    /**
     * WebRTC Signaling: Handle ICE candidates
     */
    socket.on('webrtc:ice-candidate', async (data) => {
      try {
        const { sessionCode, candidate } = data;
        
        const sessionRoom = sessionRooms.get(sessionCode);
        
        if (!sessionRoom) {
          return socket.emit('error', { message: 'Session not found' });
        }
        
        // Forward ICE candidate to the other peer
        const targetSocketId = socket.id === sessionRoom.hostSocketId
          ? sessionRoom.viewerSocketId
          : sessionRoom.hostSocketId;
        
        if (targetSocketId) {
          io.to(targetSocketId).emit('webrtc:ice-candidate', {
            candidate,
            fromSocketId: socket.id
          });
        }
        
      } catch (error) {
        logger.error('ICE candidate error:', error);
        socket.emit('error', { message: 'Failed to forward ICE candidate' });
      }
    });

    /**
     * WebRTC connection state change
     */
    socket.on('webrtc:connection-state', async (data) => {
      try {
        const { sessionCode, state } = data;
        
        const session = await Session.findActiveByCode(sessionCode);
        
        if (session) {
          await session.updateConnectionState(state);
          
          // Notify both peers
          io.to(`session:${sessionCode}`).emit('session:state-changed', {
            state,
            sessionCode
          });
        }
        
        logger.info(`Connection state for session ${sessionCode}: ${state}`);
        
      } catch (error) {
        logger.error('Connection state update error:', error);
      }
    });

    /**
     * Handle remote control events (mouse/keyboard)
     * These are forwarded to the host for execution
     */
    socket.on('control:event', async (data) => {
      try {
        const { sessionCode, event } = data;
        
        const sessionRoom = sessionRooms.get(sessionCode);
        
        if (!sessionRoom) {
          return;
        }
        
        // Only viewer can send control events
        if (socket.id !== sessionRoom.viewerSocketId) {
          return;
        }
        
        // Check if host allows control
        if (sessionRoom.controlMode === 'view-only') {
          return;
        }
        
        // Get session to check if control is allowed
        const session = await Session.findActiveByCode(sessionCode);
        
        if (!session || session.connectionType === 'view-only') {
          return;
        }
        
        // Check specific control permissions
        if (event.type === 'keyboard' && !session.settings.allowKeyboard) {
          return;
        }
        
        if (['mousemove', 'mousedown', 'mouseup', 'click', 'scroll'].includes(event.type) 
            && !session.settings.allowMouse) {
          return;
        }
        
        // Forward control event to host
        io.to(sessionRoom.hostSocketId).emit('control:event', {
          event,
          fromViewer: socket.userId
        });
        
        // Also forward to desktop agent if registered
        if (sessionRoom.agentSocketId) {
          io.to(sessionRoom.agentSocketId).emit('control:event', {
            event,
            fromViewer: socket.userId
          });
        }
        
      } catch (error) {
        logger.error('Control event error:', error);
      }
    });

    /**
     * Handle control mode change (host setting view-only or full-control)
     */
    socket.on('control-mode-change', async (data) => {
      try {
        const { sessionCode, controlMode } = data;
        
        const sessionRoom = sessionRooms.get(sessionCode);
        
        if (!sessionRoom) {
          return;
        }
        
        // Only host can change control mode
        if (socket.id !== sessionRoom.hostSocketId) {
          return;
        }
        
        // Update the session room's control mode
        sessionRoom.controlMode = controlMode;
        sessionRooms.set(sessionCode, sessionRoom);
        
        // Notify viewer of the change
        if (sessionRoom.viewerSocketId) {
          io.to(sessionRoom.viewerSocketId).emit('control-mode-change', {
            controlMode,
            sessionCode
          });
        }
        
        logger.info(`Control mode changed for session ${sessionCode}: ${controlMode}`);
        
      } catch (error) {
        logger.error('Control mode change error:', error);
      }
    });

    /**
     * End session
     */
    socket.on('session:end', async (data) => {
      try {
        const { sessionCode } = data;
        
        const sessionRoom = sessionRooms.get(sessionCode);
        
        if (!sessionRoom) {
          return;
        }
        
        // Notify all participants
        io.to(`session:${sessionCode}`).emit('session:ended', {
          sessionCode,
          endedBy: socket.userId
        });
        
        // End session in database
        const session = await Session.findActiveByCode(sessionCode);
        if (session) {
          await session.endSession();
        }
        
        // Clean up
        sessionRooms.delete(sessionCode);
        
        // Make sockets leave the room
        const sockets = await io.in(`session:${sessionCode}`).fetchSockets();
        for (const s of sockets) {
          s.leave(`session:${sessionCode}`);
          s.sessionCode = null;
          s.isHost = null;
        }
        
        logger.info(`Session ended: ${sessionCode}`);
        
      } catch (error) {
        logger.error('Session end error:', error);
      }
    });

    /**
     * Handle chat messages within session
     */
    socket.on('chat:message', async (data) => {
      try {
        const { sessionCode, message } = data;
        
        const sessionRoom = sessionRooms.get(sessionCode);
        
        if (!sessionRoom) {
          return;
        }
        
        // Broadcast message to session room
        io.to(`session:${sessionCode}`).emit('chat:message', {
          message,
          from: socket.user.email,
          timestamp: new Date()
        });
        
      } catch (error) {
        logger.error('Chat message error:', error);
      }
    });

    /**
     * Handle desktop agent registration
     * Desktop agents receive control events to execute on the host machine
     */
    socket.on('agent:register', async (data) => {
      try {
        const { sessionCode, agentType, capabilities } = data;
        
        const sessionRoom = sessionRooms.get(sessionCode);
        
        if (!sessionRoom) {
          return socket.emit('error', { message: 'Session not found' });
        }
        
        // Verify the agent belongs to the host user
        if (sessionRoom.hostSocketId !== socket.id) {
          // Store agent socket separately
          sessionRoom.agentSocketId = socket.id;
          sessionRoom.agentCapabilities = capabilities || ['mouse', 'keyboard'];
          sessionRooms.set(sessionCode, sessionRoom);
        }
        
        socket.sessionCode = sessionCode;
        socket.isAgent = true;
        socket.agentType = agentType;
        
        // Join the session room
        socket.join(`session:${sessionCode}`);
        
        socket.emit('agent:registered', {
          sessionCode,
          message: 'Desktop agent registered successfully',
          capabilities
        });
        
        // Notify host that agent is connected
        if (sessionRoom.hostSocketId) {
          io.to(sessionRoom.hostSocketId).emit('agent:connected', {
            agentType,
            capabilities
          });
        }
        
        logger.info(`Desktop agent registered for session: ${sessionCode}`);
        
      } catch (error) {
        logger.error('Agent registration error:', error);
        socket.emit('error', { message: 'Failed to register agent' });
      }
    });

    /**
     * Forward control events to desktop agent
     * Modified to also send to agent if registered
     */
    socket.on('control:forward-to-agent', async (data) => {
      try {
        const { sessionCode, event } = data;
        
        const sessionRoom = sessionRooms.get(sessionCode);
        
        if (!sessionRoom || !sessionRoom.agentSocketId) {
          return;
        }
        
        // Forward to desktop agent
        io.to(sessionRoom.agentSocketId).emit('control:event', {
          event,
          fromViewer: socket.userId
        });
        
      } catch (error) {
        logger.error('Control forward to agent error:', error);
      }
    });

    /**
     * Handle agent status updates
     */
    socket.on('agent:status', async (data) => {
      try {
        const { sessionCode, status } = data;
        
        const sessionRoom = sessionRooms.get(sessionCode);
        
        if (!sessionRoom) return;
        
        // Notify host of agent status
        if (sessionRoom.hostSocketId) {
          io.to(sessionRoom.hostSocketId).emit('agent:status', {
            sessionCode,
            status
          });
        }
        
      } catch (error) {
        logger.error('Agent status error:', error);
      }
    });

    /**
     * Handle disconnection
     */
    socket.on('disconnect', async () => {
      try {
        logger.info(`Client disconnected: ${socket.id}`);
        
        // Update device status if registered
        if (socket.deviceId) {
          const device = await Device.findOne({ deviceId: socket.deviceId });
          if (device) {
            await device.goOffline();
          }
        }
        
        // Handle agent disconnect
        if (socket.isAgent && socket.sessionCode) {
          const sessionRoom = sessionRooms.get(socket.sessionCode);
          if (sessionRoom && sessionRoom.agentSocketId === socket.id) {
            sessionRoom.agentSocketId = null;
            sessionRooms.set(socket.sessionCode, sessionRoom);
            
            // Notify host
            if (sessionRoom.hostSocketId) {
              io.to(sessionRoom.hostSocketId).emit('agent:disconnected');
            }
          }
        }
        
        // Handle session cleanup if in a session
        if (socket.sessionCode) {
          const sessionRoom = sessionRooms.get(socket.sessionCode);
          
          if (sessionRoom) {
            // Notify other participant
            io.to(`session:${socket.sessionCode}`).emit('peer:disconnected', {
              peerId: socket.id,
              isHost: socket.isHost
            });
            
            // If host disconnected, end the session
            if (socket.isHost) {
              const session = await Session.findActiveByCode(socket.sessionCode);
              if (session) {
                await session.endSession();
              }
              sessionRooms.delete(socket.sessionCode);
            } else {
              // Viewer disconnected, update session room
              sessionRoom.viewerSocketId = null;
              sessionRooms.set(socket.sessionCode, sessionRoom);
            }
          }
        }
        
        // Remove from connected clients
        connectedClients.delete(socket.id);
        
      } catch (error) {
        logger.error('Disconnect cleanup error:', error);
      }
    });

    /**
     * Handle errors
     */
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  });

  // Periodic cleanup of stale sessions
  setInterval(async () => {
    try {
      await Session.cleanupExpired();
    } catch (error) {
      logger.error('Session cleanup error:', error);
    }
  }, 60000); // Every minute

  logger.info('📡 Socket.IO signaling server initialized');
  
  return io;
};

module.exports = {
  initializeSocketServer,
  connectedClients,
  sessionRooms
};
