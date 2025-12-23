/**
 * Authentication Routes
 * API endpoints for user authentication
 */

const express = require('express');
const router = express.Router();
const { authController } = require('../controllers');
const { 
  authenticate, 
  registerValidation, 
  loginValidation 
} = require('../middleware');

// Public routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/refresh', authController.refreshToken);

// Protected routes
router.get('/me', authenticate, authController.getMe);
router.put('/me', authenticate, authController.updateMe);
router.put('/password', authenticate, authController.changePassword);
router.post('/logout', authenticate, authController.logout);

module.exports = router;
