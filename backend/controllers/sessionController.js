/**
 * Session Controller
 * Handles remote desktop session creation and management
 */

const { Session, Device, User } = require('../models');
const { generateSessionCode, formatDuration } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Create a new remote desktop session
 * POST /api/sessions
 */
const createSession = async (req, res) => {
  try {
    const { deviceId, connectionType, settings } = req.body;
    const userId = req.userId;
    
    // Find the host device
    const device = await Device.findOne({
      deviceId,
      userId,
      isActive: true
    });
    
    if (!device) {
      return res.status(404).json({
        error: 'Device not found or not owned by user'
      });
    }
    
    // Check if device is online
    if (device.status === 'offline') {
      return res.status(400).json({
        error: 'Device is offline. Please ensure the device is connected.'
      });
    }
    
    // Check if device already has an active session
    const existingSession = await Session.findOne({
      hostDevice: device._id,
      active: true,
      status: { $in: ['pending', 'connecting', 'active'] }
    });
    
    if (existingSession) {
      return res.status(409).json({
        error: 'Device already has an active session',
        sessionCode: existingSession.sessionCode
      });
    }
    
    // Create new session
    const session = new Session({
      sessionId: generateSessionCode(),
      sessionCode: generateSessionCode(),
      hostDevice: device._id,
      hostUser: userId,
      connectionType: connectionType || 'full-control',
      settings: settings || {},
      metadata: {
        hostOS: device.os,
        hostBrowser: device.browser
      }
    });
    
    await session.save();
    
    // Update device status
    await device.setBusy();
    
    logger.info(`Session created: ${session.sessionCode} by user ${userId}`);
    
    res.status(201).json({
      message: 'Session created successfully',
      session: {
        id: session._id,
        sessionCode: session.sessionCode,
        connectionType: session.connectionType,
        status: session.status,
        expiresAt: session.expiresAt,
        settings: session.settings
      }
    });
    
  } catch (error) {
    logger.error('Create session error:', error);
    res.status(500).json({
      error: 'Failed to create session'
    });
  }
};

/**
 * Join an existing session
 * POST /api/sessions/join
 */
const joinSession = async (req, res) => {
  try {
    const { sessionCode, deviceId } = req.body;
    const userId = req.userId;
    
    // Find the session
    const session = await Session.findActiveByCode(sessionCode);
    
    if (!session) {
      return res.status(404).json({
        error: 'Session not found or has expired'
      });
    }
    
    // Check if session already has a viewer
    if (session.viewer && session.status === 'active') {
      return res.status(409).json({
        error: 'Session already has an active viewer. Only one viewer allowed.'
      });
    }
    
    // Prevent host from joining their own session
    if (session.hostUser._id.toString() === userId) {
      return res.status(400).json({
        error: 'Cannot join your own session as a viewer'
      });
    }
    
    // Find viewer's device
    const viewerDevice = await Device.findOne({
      deviceId,
      userId,
      isActive: true
    });
    
    if (!viewerDevice) {
      return res.status(404).json({
        error: 'Viewer device not found'
      });
    }
    
    // Update session with viewer info
    session.viewer = userId;
    session.viewerDevice = viewerDevice._id;
    session.status = 'connecting';
    session.metadata.viewerOS = viewerDevice.os;
    session.metadata.viewerBrowser = viewerDevice.browser;
    
    // Extend expiration
    session.expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    
    await session.save();
    
    // Populate host device info for response
    await session.populate('hostDevice', 'deviceId name type');
    
    logger.info(`User ${userId} joining session ${sessionCode}`);
    
    res.json({
      message: 'Joined session successfully',
      session: {
        id: session._id,
        sessionCode: session.sessionCode,
        connectionType: session.connectionType,
        status: session.status,
        hostDevice: {
          id: session.hostDevice.deviceId,
          name: session.hostDevice.name,
          type: session.hostDevice.type
        },
        settings: session.settings
      }
    });
    
  } catch (error) {
    logger.error('Join session error:', error);
    res.status(500).json({
      error: 'Failed to join session'
    });
  }
};

/**
 * Get session details
 * GET /api/sessions/:sessionId
 */
const getSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId)
      .populate('hostDevice', 'deviceId name type status')
      .populate('viewerDevice', 'deviceId name type')
      .populate('hostUser', 'email name')
      .populate('viewer', 'email name');
    
    if (!session) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }
    
    // Check if user is part of this session
    const isHost = session.hostUser._id.toString() === req.userId;
    const isViewer = session.viewer && session.viewer._id.toString() === req.userId;
    
    if (!isHost && !isViewer) {
      return res.status(403).json({
        error: 'Access denied to this session'
      });
    }
    
    res.json({
      session: {
        id: session._id,
        sessionCode: session.sessionCode,
        status: session.status,
        connectionType: session.connectionType,
        hostDevice: session.hostDevice,
        viewerDevice: session.viewerDevice,
        startTime: session.startTime,
        duration: session.duration || 
          (session.startTime ? formatDuration(session.startTime) : null),
        settings: session.settings,
        isHost,
        isViewer
      }
    });
    
  } catch (error) {
    logger.error('Get session error:', error);
    res.status(500).json({
      error: 'Failed to fetch session'
    });
  }
};

/**
 * End a session
 * POST /api/sessions/:sessionId/end
 */
const endSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    
    if (!session) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }
    
    // Check if user can end this session
    const isHost = session.hostUser.toString() === req.userId;
    const isViewer = session.viewer && session.viewer.toString() === req.userId;
    
    if (!isHost && !isViewer) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }
    
    // End the session
    await session.endSession();
    
    // Update host device status
    const hostDevice = await Device.findById(session.hostDevice);
    if (hostDevice) {
      hostDevice.status = 'online';
      await hostDevice.save();
    }
    
    logger.info(`Session ended: ${session.sessionCode}`);
    
    res.json({
      message: 'Session ended successfully',
      session: {
        id: session._id,
        sessionCode: session.sessionCode,
        status: session.status,
        duration: session.duration,
        endTime: session.endTime
      }
    });
    
  } catch (error) {
    logger.error('End session error:', error);
    res.status(500).json({
      error: 'Failed to end session'
    });
  }
};

/**
 * Get active sessions for current user
 * GET /api/sessions/active
 */
const getActiveSessions = async (req, res) => {
  try {
    const sessions = await Session.findActiveByUser(req.userId);
    
    res.json({
      count: sessions.length,
      sessions: sessions.map(session => ({
        id: session._id,
        sessionCode: session.sessionCode,
        status: session.status,
        connectionType: session.connectionType,
        isHost: session.hostUser.toString() === req.userId,
        startTime: session.startTime,
        createdAt: session.createdAt
      }))
    });
    
  } catch (error) {
    logger.error('Get active sessions error:', error);
    res.status(500).json({
      error: 'Failed to fetch active sessions'
    });
  }
};

/**
 * Get session history for current user
 * GET /api/sessions/history
 */
const getSessionHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const sessions = await Session.find({
      $or: [
        { hostUser: req.userId },
        { viewer: req.userId }
      ]
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('hostDevice', 'name type')
      .populate('viewerDevice', 'name type');
    
    const total = await Session.countDocuments({
      $or: [
        { hostUser: req.userId },
        { viewer: req.userId }
      ]
    });
    
    res.json({
      sessions: sessions.map(session => ({
        id: session._id,
        sessionCode: session.sessionCode,
        status: session.status,
        connectionType: session.connectionType,
        isHost: session.hostUser.toString() === req.userId,
        hostDevice: session.hostDevice?.name,
        viewerDevice: session.viewerDevice?.name,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.duration,
        createdAt: session.createdAt
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    logger.error('Get session history error:', error);
    res.status(500).json({
      error: 'Failed to fetch session history'
    });
  }
};

/**
 * Update session settings
 * PATCH /api/sessions/:sessionId/settings
 */
const updateSessionSettings = async (req, res) => {
  try {
    const { allowKeyboard, allowMouse, quality } = req.body;
    
    const session = await Session.findById(req.params.sessionId);
    
    if (!session) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }
    
    // Only host can update settings
    if (session.hostUser.toString() !== req.userId) {
      return res.status(403).json({
        error: 'Only the host can update session settings'
      });
    }
    
    if (allowKeyboard !== undefined) session.settings.allowKeyboard = allowKeyboard;
    if (allowMouse !== undefined) session.settings.allowMouse = allowMouse;
    if (quality) session.settings.quality = quality;
    
    await session.save();
    
    res.json({
      message: 'Settings updated',
      settings: session.settings
    });
    
  } catch (error) {
    logger.error('Update session settings error:', error);
    res.status(500).json({
      error: 'Failed to update settings'
    });
  }
};

module.exports = {
  createSession,
  joinSession,
  getSession,
  endSession,
  getActiveSessions,
  getSessionHistory,
  updateSessionSettings
};
