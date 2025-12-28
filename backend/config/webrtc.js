/**
 * WebRTC Configuration
 * STUN/TURN server settings for NAT traversal
 */

// Get TURN credentials from environment or use free public servers
const getTurnServers = () => {
  // If custom TURN server is configured, use it
  if (process.env.TURN_SERVER_URL && process.env.TURN_USERNAME && process.env.TURN_CREDENTIAL) {
    return [
      {
        urls: process.env.TURN_SERVER_URL,
        username: process.env.TURN_USERNAME,
        credential: process.env.TURN_CREDENTIAL
      }
    ];
  }
  
  // Free public TURN servers (may be unreliable)
  return [
    // OpenRelay TURN servers
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
    // Numb TURN server
    {
      urls: 'turn:numb.viagenie.ca',
      username: 'webrtc@live.com',
      credential: 'muazkh'
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
