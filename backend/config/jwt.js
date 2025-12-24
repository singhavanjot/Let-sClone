/**
 * JWT Configuration
 * Token generation and verification settings
 */

module.exports = {
  // JWT secret key (should be set in environment variables)
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  
  // Token expiration time
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // Refresh token expiration
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  
  // Token issuer
  issuer: 'letsclone-app',
  
  // Token audience
  audience: 'letsclone-users'
};
