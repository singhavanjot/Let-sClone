/**
 * Session Model
 * MongoDB schema for remote desktop sessions
 */

const mongoose = require('mongoose');
const { generateSessionCode } = require('../utils/helpers');

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    default: generateSessionCode
  },
  
  sessionCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    default: generateSessionCode
  },
  
  hostDevice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: [true, 'Host device is required']
  },
  
  hostUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Host user is required']
  },
  
  viewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  viewerDevice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    default: null
  },
  
  status: {
    type: String,
    enum: ['pending', 'connecting', 'active', 'paused', 'ended'],
    default: 'pending'
  },
  
  connectionType: {
    type: String,
    enum: ['view-only', 'full-control'],
    default: 'full-control'
  },
  
  startTime: {
    type: Date,
    default: null
  },
  
  endTime: {
    type: Date,
    default: null
  },
  
  duration: {
    type: Number, // Duration in seconds
    default: 0
  },
  
  // WebRTC connection details
  iceConnectionState: {
    type: String,
    default: null
  },
  
  // Session metadata
  metadata: {
    hostBrowser: String,
    hostOS: String,
    viewerBrowser: String,
    viewerOS: String,
    hostIP: String,
    viewerIP: String
  },
  
  // Session settings
  settings: {
    allowKeyboard: { type: Boolean, default: true },
    allowMouse: { type: Boolean, default: true },
    quality: { type: String, enum: ['low', 'medium', 'high', 'auto'], default: 'auto' }
  },
  
  active: {
    type: Boolean,
    default: true
  },
  
  expiresAt: {
    type: Date,
    default: function() {
      // Session code expires in 10 minutes if not used
      return new Date(Date.now() + 10 * 60 * 1000);
    }
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for faster queries
sessionSchema.index({ sessionCode: 1 });
sessionSchema.index({ hostDevice: 1 });
sessionSchema.index({ hostUser: 1 });
sessionSchema.index({ viewer: 1 });
sessionSchema.index({ status: 1 });
sessionSchema.index({ active: 1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Virtual for checking if session is expired
sessionSchema.virtual('isExpired').get(function() {
  return this.expiresAt && new Date() > this.expiresAt;
});

// Instance method to start session
sessionSchema.methods.startSession = async function(viewerId, viewerDeviceId) {
  this.viewer = viewerId;
  this.viewerDevice = viewerDeviceId;
  this.status = 'active';
  this.startTime = new Date();
  // Extend expiration for active session (30 minutes)
  this.expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  await this.save();
};

// Instance method to end session
sessionSchema.methods.endSession = async function() {
  this.status = 'ended';
  this.endTime = new Date();
  this.active = false;
  
  if (this.startTime) {
    this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  }
  
  await this.save();
};

// Instance method to update ICE connection state
sessionSchema.methods.updateConnectionState = async function(state) {
  this.iceConnectionState = state;
  
  if (state === 'connected' || state === 'completed') {
    this.status = 'active';
  } else if (state === 'disconnected' || state === 'failed') {
    this.status = 'ended';
    this.active = false;
    this.endTime = new Date();
    if (this.startTime) {
      this.duration = Math.floor((this.endTime - this.startTime) / 1000);
    }
  }
  
  await this.save();
};

// Static method to find active session by code
sessionSchema.statics.findActiveByCode = function(sessionCode) {
  return this.findOne({
    sessionCode: sessionCode.toUpperCase(),
    active: true,
    status: { $in: ['pending', 'connecting', 'active'] }
  }).populate('hostDevice hostUser');
};

// Static method to find active sessions for a user
sessionSchema.statics.findActiveByUser = function(userId) {
  return this.find({
    $or: [{ hostUser: userId }, { viewer: userId }],
    active: true
  }).populate('hostDevice viewerDevice');
};

// Static method to cleanup expired sessions
sessionSchema.statics.cleanupExpired = async function() {
  return this.updateMany(
    {
      active: true,
      expiresAt: { $lt: new Date() }
    },
    {
      $set: {
        active: false,
        status: 'ended',
        endTime: new Date()
      }
    }
  );
};

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
