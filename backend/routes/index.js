/**
 * Routes Index
 * Export all route modules
 */

const authRoutes = require('./auth');
const deviceRoutes = require('./device');
const sessionRoutes = require('./session');

module.exports = {
  authRoutes,
  deviceRoutes,
  sessionRoutes
};
