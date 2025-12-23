/**
 * Controllers Index
 * Export all controller functions
 */

const authController = require('./authController');
const deviceController = require('./deviceController');
const sessionController = require('./sessionController');

module.exports = {
  authController,
  deviceController,
  sessionController
};
