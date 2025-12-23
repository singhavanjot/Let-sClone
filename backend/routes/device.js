/**
 * Device Routes
 * API endpoints for device management
 */

const express = require('express');
const router = express.Router();
const { deviceController } = require('../controllers');
const { authenticate, deviceValidation } = require('../middleware');

// All routes require authentication
router.use(authenticate);

// Device routes
router.post('/', deviceValidation, deviceController.registerDevice);
router.get('/', deviceController.getDevices);
router.get('/online', deviceController.getOnlineDevices);
router.get('/:deviceId', deviceController.getDevice);
router.put('/:deviceId', deviceController.updateDevice);
router.delete('/:deviceId', deviceController.deleteDevice);

module.exports = router;
