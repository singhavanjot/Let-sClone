/**
 * WebRTC Configuration
 * STUN/TURN server settings for NAT traversal
 */

module.exports = {
  // ICE servers configuration
  iceServers: [
    // Google's public STUN servers
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    
    // Add your TURN server configuration here for production
    // {
    //   urls: 'turn:your-turn-server.com:3478',
    //   username: process.env.TURN_USERNAME,
    //   credential: process.env.TURN_CREDENTIAL
    // }
  ],
  
  // Session timeout in milliseconds (30 minutes)
  sessionTimeout: 30 * 60 * 1000,
  
  // Maximum concurrent sessions per user
  maxSessionsPerUser: 5,
  
  // ICE candidate gathering timeout
  iceCandidateTimeout: 10000
};
