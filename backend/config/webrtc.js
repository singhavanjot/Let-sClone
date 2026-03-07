/**
 * WebRTC Configuration
 * STUN/TURN server settings for NAT traversal
 * 
 * SETUP (required for cross-network connections):
 * 1. Sign up at https://www.metered.ca/ (free - 50GB/month)
 * 2. Go to Dashboard > TURN Server > API Key
 * 3. Set environment variable: METERED_API_KEY=<your-api-key>
 */

const logger = require('../utils/logger');

// Cache for TURN credentials (refresh every 12 hours)
let cachedTurnServers = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours

/**
 * Fetch fresh TURN credentials from Metered.ca REST API
 */
async function fetchMeteredTurnCredentials() {
  const apiKey = process.env.METERED_API_KEY;
  if (!apiKey) {
    return null;
  }
  
  try {
    const response = await fetch(
      `https://letsclone.metered.live/api/v1/turn/credentials?apiKey=${encodeURIComponent(apiKey)}`
    );
    
    if (!response.ok) {
      logger.error(`[TURN] Metered API error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const credentials = await response.json();
    logger.info(`[TURN] ✅ Fetched ${credentials.length} TURN servers from Metered.ca API`);
    return credentials;
  } catch (error) {
    logger.error(`[TURN] Failed to fetch Metered credentials: ${error.message}`);
    return null;
  }
}

/**
 * Get TURN servers from static env vars (TURN_SERVER_URL, TURN_USERNAME, TURN_CREDENTIAL)
 */
function getStaticTurnServers() {
  if (process.env.TURN_SERVER_URL && process.env.TURN_USERNAME && process.env.TURN_CREDENTIAL) {
    const username = process.env.TURN_USERNAME;
    const credential = process.env.TURN_CREDENTIAL;
    const urlMatch = process.env.TURN_SERVER_URL.match(/turn[s]?:([^:/?]+)/);
    const host = urlMatch ? urlMatch[1] : 'global.relay.metered.ca';
    
    logger.info(`[TURN] Using static TURN server: ${host}`);
    
    return [
      { urls: `turn:${host}:80`, username, credential },
      { urls: `turn:${host}:443`, username, credential },
      { urls: `turn:${host}:443?transport=tcp`, username, credential },
      { urls: `turns:${host}:443?transport=tcp`, username, credential },
      { urls: `turn:${host}:3478`, username, credential },
      { urls: `turn:${host}:3478?transport=tcp`, username, credential }
    ];
  }
  return null;
}

/**
 * Get ICE servers with fresh TURN credentials
 * Tries: 1) Metered API  2) Static env vars  3) Hardcoded fallbacks
 */
async function getIceServers() {
  const stun = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ];

  // Check cache first
  if (cachedTurnServers && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
    logger.info(`[TURN] Using cached TURN credentials (age: ${Math.round((Date.now() - cacheTimestamp) / 60000)}min)`);
    return [...stun, ...cachedTurnServers];
  }

  // Try Metered API first
  const meteredCreds = await fetchMeteredTurnCredentials();
  if (meteredCreds && meteredCreds.length > 0) {
    cachedTurnServers = meteredCreds;
    cacheTimestamp = Date.now();
    return [...stun, ...meteredCreds];
  }

  // Try static env vars
  const staticServers = getStaticTurnServers();
  if (staticServers) {
    cachedTurnServers = staticServers;
    cacheTimestamp = Date.now();
    return [...stun, ...staticServers];
  }

  // No TURN configured
  logger.warn('[TURN] ⚠️ NO TURN SERVER CONFIGURED! Cross-network connections will fail.');
  logger.warn('[TURN] Set METERED_API_KEY env var. Get free key at https://www.metered.ca/');
  return stun;
}

module.exports = {
  // Dynamic ICE servers getter (fetches fresh TURN creds)
  getIceServers,
  
  // Session timeout in milliseconds (30 minutes)
  sessionTimeout: 30 * 60 * 1000,
  
  // Maximum concurrent sessions per user
  maxSessionsPerUser: 5,
  
  // ICE candidate gathering timeout
  iceCandidateTimeout: 15000
};
