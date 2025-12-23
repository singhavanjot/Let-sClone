/**
 * Device Controller
 * Handles device registration and management
 */

const { Device, User } = require('../models');
const { generateDeviceId } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Register a new device
 * POST /api/devices
 */
const registerDevice = async (req, res) => {
  try {
    const { name, type, os, browser } = req.body;
    const userId = req.userId;
    
    // Create new device
    const device = new Device({
      deviceId: generateDeviceId(),
      userId,
      name,
      type: type || 'desktop',
      os,
      browser,
      status: 'offline'
    });
    
    await device.save();
    
    // Add device to user's devices array
    await User.findByIdAndUpdate(userId, {
      $push: { devices: device._id }
    });
    
    logger.info(`Device registered: ${device.deviceId} for user ${userId}`);
    
    res.status(201).json({
      message: 'Device registered successfully',
      device: {
        id: device._id,
        deviceId: device.deviceId,
        name: device.name,
        type: device.type,
        status: device.status,
        createdAt: device.createdAt
      }
    });
    
  } catch (error) {
    logger.error('Device registration error:', error);
    res.status(500).json({
      error: 'Failed to register device'
    });
  }
};

/**
 * Get all devices for current user
 * GET /api/devices
 */
const getDevices = async (req, res) => {
  try {
    const devices = await Device.find({
      userId: req.userId,
      isActive: true
    }).select('-socketId -ipAddress').sort({ createdAt: -1 });
    
    res.json({
      count: devices.length,
      devices
    });
    
  } catch (error) {
    logger.error('Get devices error:', error);
    res.status(500).json({
      error: 'Failed to fetch devices'
    });
  }
};

/**
 * Get a specific device
 * GET /api/devices/:deviceId
 */
const getDevice = async (req, res) => {
  try {
    const device = await Device.findOne({
      deviceId: req.params.deviceId,
      userId: req.userId,
      isActive: true
    }).select('-socketId -ipAddress');
    
    if (!device) {
      return res.status(404).json({
        error: 'Device not found'
      });
    }
    
    res.json({ device });
    
  } catch (error) {
    logger.error('Get device error:', error);
    res.status(500).json({
      error: 'Failed to fetch device'
    });
  }
};

/**
 * Update device
 * PUT /api/devices/:deviceId
 */
const updateDevice = async (req, res) => {
  try {
    const { name, type } = req.body;
    const updates = {};
    
    if (name) updates.name = name;
    if (type) updates.type = type;
    
    const device = await Device.findOneAndUpdate(
      {
        deviceId: req.params.deviceId,
        userId: req.userId,
        isActive: true
      },
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-socketId -ipAddress');
    
    if (!device) {
      return res.status(404).json({
        error: 'Device not found'
      });
    }
    
    res.json({
      message: 'Device updated',
      device
    });
    
  } catch (error) {
    logger.error('Update device error:', error);
    res.status(500).json({
      error: 'Failed to update device'
    });
  }
};

/**
 * Delete device
 * DELETE /api/devices/:deviceId
 */
const deleteDevice = async (req, res) => {
  try {
    const device = await Device.findOneAndUpdate(
      {
        deviceId: req.params.deviceId,
        userId: req.userId
      },
      { $set: { isActive: false, status: 'offline', socketId: null } },
      { new: true }
    );
    
    if (!device) {
      return res.status(404).json({
        error: 'Device not found'
      });
    }
    
    // Remove from user's devices array
    await User.findByIdAndUpdate(req.userId, {
      $pull: { devices: device._id }
    });
    
    logger.info(`Device deleted: ${device.deviceId}`);
    
    res.json({
      message: 'Device deleted successfully'
    });
    
  } catch (error) {
    logger.error('Delete device error:', error);
    res.status(500).json({
      error: 'Failed to delete device'
    });
  }
};

/**
 * Get online devices for current user
 * GET /api/devices/online
 */
const getOnlineDevices = async (req, res) => {
  try {
    const devices = await Device.find({
      userId: req.userId,
      status: 'online',
      isActive: true
    }).select('deviceId name type status lastSeen');
    
    res.json({
      count: devices.length,
      devices
    });
    
  } catch (error) {
    logger.error('Get online devices error:', error);
    res.status(500).json({
      error: 'Failed to fetch online devices'
    });
  }
};

module.exports = {
  registerDevice,
  getDevices,
  getDevice,
  updateDevice,
  deleteDevice,
  getOnlineDevices
};
