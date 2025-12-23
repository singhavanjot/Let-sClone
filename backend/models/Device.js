/**
 * Device Model
 * MongoDB schema for registered devices
 */

const mongoose = require('mongoose');
const { generateDeviceId } = require('../utils/helpers');

const deviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true,
    default: generateDeviceId
  },
  
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  
  name: {
    type: String,
    required: [true, 'Device name is required'],
    trim: true,
    maxlength: [100, 'Device name cannot exceed 100 characters']
  },
  
  type: {
    type: String,
    enum: ['desktop', 'laptop', 'mobile', 'tablet', 'other'],
    default: 'desktop'
  },
  
  os: {
    type: String,
    trim: true
  },
  
  browser: {
    type: String,
    trim: true
  },
  
  status: {
    type: String,
    enum: ['online', 'offline', 'busy'],
    default: 'offline'
  },
  
  lastSeen: {
    type: Date,
    default: Date.now
  },
  
  socketId: {
    type: String,
    default: null
  },
  
  ipAddress: {
    type: String
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for faster queries (deviceId already indexed via unique: true)
deviceSchema.index({ userId: 1 });
deviceSchema.index({ status: 1 });
deviceSchema.index({ socketId: 1 });

// Update device status to online
deviceSchema.methods.goOnline = async function(socketId, ipAddress) {
  this.status = 'online';
  this.socketId = socketId;
  this.lastSeen = new Date();
  if (ipAddress) {
    this.ipAddress = ipAddress;
  }
  await this.save();
};

// Update device status to offline
deviceSchema.methods.goOffline = async function() {
  this.status = 'offline';
  this.socketId = null;
  this.lastSeen = new Date();
  await this.save();
};

// Update device status to busy (in active session)
deviceSchema.methods.setBusy = async function() {
  this.status = 'busy';
  this.lastSeen = new Date();
  await this.save();
};

// Static method to find online devices for a user
deviceSchema.statics.findOnlineByUser = function(userId) {
  return this.find({ userId, status: 'online', isActive: true });
};

// Static method to find device by socket ID
deviceSchema.statics.findBySocketId = function(socketId) {
  return this.findOne({ socketId });
};

const Device = mongoose.model('Device', deviceSchema);

module.exports = Device;
