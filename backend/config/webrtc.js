/**
 * WebRTC Configuration
 * STUN/TURN server settings for NAT traversal
 */

// Get TURN credentials from environment or use free public servers
const getTurnServers = () => {
  // If custom TURN server is configured, use it with multiple URL formats
  if (process.env.TURN_SERVER_URL && process.env.TURN_USERNAME && process.env.TURN_CREDENTIAL) {
    const username = process.env.TURN_USERNAME;
    const credential = process.env.TURN_CREDENTIAL;
    
    // Extract the host from the URL (e.g., global.relay.metered.ca from turn:global.relay.metered.ca:80)
    const urlMatch = process.env.TURN_SERVER_URL.match(/turn:([^:]+)/);
    const host = urlMatch ? urlMatch[1] : 'global.relay.metered.ca';
    
    console.log(`[WebRTC Config] Using Metered.ca TURN server: ${host}`);
    
    return [
      // UDP on port 80 (most compatible)
      {
        urls: `turn:${host}:80`,
        username,
        credential
      },
      // UDP on port 443
      {
        urls: `turn:${host}:443`,
        username,
        credential
      },
      // TCP on port 443 (works through most firewalls)
      {
        urls: `turn:${host}:443?transport=tcp`,
        username,
        credential
      },
      // TLS/TURNS on port 443 (most secure, works through strict firewalls)
      {
        urls: `turns:${host}:443?transport=tcp`,
        username,
        credential
      },
      // UDP on standard TURN port
      {
        urls: `turn:${host}:3478`,
        username,
        credential
      },
      // TCP on standard TURN port
      {
        urls: `turn:${host}:3478?transport=tcp`,
        username,
        credential
      }
    ];
  }
  
  console.log('[WebRTC Config] No custom TURN server configured, using free public servers');
  
  // Free public TURN servers - multiple providers for reliability
  // IMPORTANT: For production, get your own free account at https://www.metered.ca/stun-turn (50GB/month free)
  return [
    // Metered.ca free TURN servers (most reliable, multiple regions)
    {
      urls: 'turn:a.relay.metered.ca:80',
      username: 'e8dd65b92c62d5e62f54de02',
      credential: 'uWdWNmkhvyqTmFXB'
    },
    {
      urls: 'turn:a.relay.metered.ca:80?transport=tcp',
      username: 'e8dd65b92c62d5e62f54de02',
      credential: 'uWdWNmkhvyqTmFXB'
    },
    {
      urls: 'turn:a.relay.metered.ca:443',
      username: 'e8dd65b92c62d5e62f54de02',
      credential: 'uWdWNmkhvyqTmFXB'
    },
    {
      urls: 'turn:a.relay.metered.ca:443?transport=tcp',
      username: 'e8dd65b92c62d5e62f54de02',
      credential: 'uWdWNmkhvyqTmFXB'
    },
    {
      urls: 'turns:a.relay.metered.ca:443?transport=tcp',
      username: 'e8dd65b92c62d5e62f54de02',
      credential: 'uWdWNmkhvyqTmFXB'
    },
    // Additional Metered.ca regions
    {
      urls: 'turn:b.relay.metered.ca:80',
      username: 'e8dd65b92c62d5e62f54de02',
      credential: 'uWdWNmkhvyqTmFXB'
    },
    {
      urls: 'turn:b.relay.metered.ca:443?transport=tcp',
      username: 'e8dd65b92c62d5e62f54de02',
      credential: 'uWdWNmkhvyqTmFXB'
    },
    // OpenRelay public TURN (free, community maintained)
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turns:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ];
};

module.exports = {
  // ICE servers configuration
  iceServers: [
    // Google's public STUN servers
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    
    // TURN servers
    ...getTurnServers()
  ],
  
  // Session timeout in milliseconds (30 minutes)
  sessionTimeout: 30 * 60 * 1000,
  
  // Maximum concurrent sessions per user
  maxSessionsPerUser: 5,
  
  // ICE candidate gathering timeout
  iceCandidateTimeout: 10000
};
