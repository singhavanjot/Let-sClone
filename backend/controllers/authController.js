/**
 * Authentication Controller
 * Handles user registration, login, and token management
 */

const { User } = require('../models');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../middleware/auth');
const { sanitizeUser } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    if (existingUser) {
      return res.status(409).json({
        error: 'An account with this email already exists'
      });
    }
    
    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      password,
      name
    });
    
    await user.save();
    
    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    
    logger.info(`New user registered: ${user.email}`);
    
    res.status(201).json({
      message: 'Registration successful',
      user: sanitizeUser(user),
      token,
      refreshToken
    });
    
  } catch (error) {
    logger.error('Registration error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        error: 'An account with this email already exists'
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        error: 'Validation failed',
        details: messages
      });
    }
    
    res.status(500).json({
      error: 'Registration failed. Please try again.'
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user with password field
    const user = await User.findByEmailWithPassword(email.toLowerCase());
    
    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }
    
    if (!user.isActive) {
      return res.status(403).json({
        error: 'Account is deactivated. Please contact support.'
      });
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }
    
    // Update last login
    await user.updateLastLogin();
    
    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    
    logger.info(`User logged in: ${user.email}`);
    
    res.json({
      message: 'Login successful',
      user: sanitizeUser(user),
      token,
      refreshToken
    });
    
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed. Please try again.'
    });
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        error: 'Refresh token is required'
      });
    }
    
    // Verify refresh token
    const decoded = verifyRefreshToken(token);
    
    // Find user
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Invalid refresh token'
      });
    }
    
    // Generate new tokens
    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);
    
    res.json({
      message: 'Token refreshed',
      token: newToken,
      refreshToken: newRefreshToken
    });
    
  } catch (error) {
    logger.error('Token refresh error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Refresh token expired. Please login again.'
      });
    }
    
    res.status(401).json({
      error: 'Invalid refresh token'
    });
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate({
        path: 'devices',
        match: { isActive: true },
        select: 'deviceId name type status lastSeen'
      });
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }
    
    res.json({
      user: sanitizeUser(user)
    });
    
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      error: 'Failed to fetch profile'
    });
  }
};

/**
 * Update user profile
 * PUT /api/auth/me
 */
const updateMe = async (req, res) => {
  try {
    const { name, email } = req.body;
    const updates = {};
    
    if (name) updates.name = name;
    if (email) {
      // Check if email is already taken
      const existingUser = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: req.userId }
      });
      
      if (existingUser) {
        return res.status(409).json({
          error: 'Email is already in use'
        });
      }
      
      updates.email = email.toLowerCase();
    }
    
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }
    
    res.json({
      message: 'Profile updated',
      user: sanitizeUser(user)
    });
    
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      error: 'Failed to update profile'
    });
  }
};

/**
 * Change password
 * PUT /api/auth/password
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Current password and new password are required'
      });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'New password must be at least 8 characters'
      });
    }
    
    // Get user with password
    const user = await User.findById(req.userId).select('+password');
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }
    
    // Verify current password
    const isValid = await user.comparePassword(currentPassword);
    
    if (!isValid) {
      return res.status(401).json({
        error: 'Current password is incorrect'
      });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    // Generate new tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    
    logger.info(`Password changed for user: ${user.email}`);
    
    res.json({
      message: 'Password changed successfully',
      token,
      refreshToken
    });
    
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({
      error: 'Failed to change password'
    });
  }
};

/**
 * Logout user (client-side token removal)
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  // In a more complex implementation, you might want to:
  // - Invalidate the token in a blacklist
  // - Remove refresh tokens from database
  // For now, we just acknowledge the logout
  
  logger.info(`User logged out: ${req.user.email}`);
  
  res.json({
    message: 'Logout successful'
  });
};

module.exports = {
  register,
  login,
  refreshToken,
  getMe,
  updateMe,
  changePassword,
  logout
};
