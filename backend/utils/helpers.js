/**
 * Utility Helpers
 * Common utility functions used across the application
 */

const crypto = require('crypto');

/**
 * Generate a unique session code
 * @param {number} length - Length of the code (default: 6)
 * @returns {string} Alphanumeric session code
 */
const generateSessionCode = (length = 6) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded confusing chars like 0, O, 1, I
  let code = '';
  const randomBytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    code += chars[randomBytes[i] % chars.length];
  }
  
  return code;
};

/**
 * Generate a unique device ID
 * @returns {string} UUID-based device ID
 */
const generateDeviceId = () => {
  return crypto.randomUUID();
};

/**
 * Sanitize user object for response (remove sensitive fields)
 * @param {Object} user - Mongoose user document
 * @returns {Object} Sanitized user object
 */
const sanitizeUser = (user) => {
  const userObj = user.toObject ? user.toObject() : { ...user };
  delete userObj.password;
  delete userObj.__v;
  return userObj;
};

/**
 * Calculate time difference in human readable format
 * @param {Date} startTime - Start time
 * @param {Date} endTime - End time (default: now)
 * @returns {string} Human readable duration
 */
const formatDuration = (startTime, endTime = new Date()) => {
  const diffMs = endTime - startTime;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  
  if (diffHours > 0) {
    return `${diffHours}h ${diffMins % 60}m`;
  } else if (diffMins > 0) {
    return `${diffMins}m ${diffSecs % 60}s`;
  } else {
    return `${diffSecs}s`;
  }
};

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Create error response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @returns {Object} Error object
 */
const createError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

module.exports = {
  generateSessionCode,
  generateDeviceId,
  sanitizeUser,
  formatDuration,
  isValidEmail,
  createError
};
