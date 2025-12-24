/**
 * Session Routes
 * API endpoints for Let'sClone session management
 */

const express = require('express');
const router = express.Router();
const { sessionController } = require('../controllers');
const { 
  authenticate, 
  createSessionValidation, 
  joinSessionValidation,
  paginationValidation 
} = require('../middleware');

// All routes require authentication
router.use(authenticate);

// Session routes
router.post('/', createSessionValidation, sessionController.createSession);
router.post('/join', joinSessionValidation, sessionController.joinSession);
router.get('/active', sessionController.getActiveSessions);
router.get('/history', paginationValidation, sessionController.getSessionHistory);
router.get('/:sessionId', sessionController.getSession);
router.post('/:sessionId/end', sessionController.endSession);
router.patch('/:sessionId/settings', sessionController.updateSessionSettings);

module.exports = router;
