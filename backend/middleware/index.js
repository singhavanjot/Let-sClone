/**
 * Middleware Index
 * Export all middleware functions
 */

const authMiddleware = require('./auth');
const validationMiddleware = require('./validation');

module.exports = {
  ...authMiddleware,
  ...validationMiddleware
};
