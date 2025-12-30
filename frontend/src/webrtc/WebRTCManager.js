/**
 * WebRTC Peer Connection Manager
 * Handles WebRTC connection setup, screen capture, and data channels
 */

class WebRTCManager {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.dataChannel = null;
    this.remoteStream = null;
    this.iceServers = [];
    
    // Callbacks
    this.onRemoteStream = null;
    this.onDataChannelMessage = null;
    this.onConnectionStateChange = null;
    this.onIceCandidate = null;
    this.onIceRestart = null;  // Called when ICE restart is needed
    this.onError = null;

    // Pending ICE candidates (received before remote description set)
    this.pendingCandidates = [];
  }

  /**
   * Initialize with ICE servers configuration
   * @param {Array} iceServers - STUN/TURN servers
   */
  setIceServers(iceServers) {
    this.iceServers = iceServers;
  }

  /**
   * Create a new peer connection
   * @param {boolean} isHost - Whether this is the host (offers) or viewer (answers)
   */
  async createPeerConnection(isHost = true) {
    try {
      // Log ICE servers for debugging
      console.log('Creating peer connection with ICE servers:', this.iceServers.length);
      
      // Create peer connection with more aggressive ICE settings
      this.peerConnection = new RTCPeerConnection({
        iceServers: this.iceServers,
        iceCandidatePoolSize: 10,
        iceTransportPolicy: 'all', // Try all candidates (relay + direct)
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require'
      });

      // Track candidate types for debugging
      let candidateCounts = { host: 0, srflx: 0, relay: 0, prflx: 0 };

      // Handle ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          const candidateType = event.candidate.type || 'unknown';
          candidateCounts[candidateType] = (candidateCounts[candidateType] || 0) + 1;
          
          // Log relay candidates specially - these are critical for cross-network connections
          if (candidateType === 'relay') {
            console.log('✅ RELAY candidate found (TURN working):', event.candidate.protocol, event.candidate.address);
          } else {
            console.log('ICE candidate found:', candidateType, event.candidate.protocol);
          }
          
          if (this.onIceCandidate) {
            this.onIceCandidate(event.candidate);
          }
        } else {
          console.log('ICE gathering complete. Candidates:', candidateCounts);
          if (candidateCounts.relay === 0) {
            console.warn('⚠️ NO RELAY CANDIDATES FOUND! TURN servers may not be working. Cross-network connections will fail.');
          }
        }
      };

      // Handle ICE gathering state
      this.peerConnection.onicegatheringstatechange = () => {
        console.log('ICE gathering state:', this.peerConnection.iceGatheringState);
      };

      // Handle connection state changes
      this.peerConnection.onconnectionstatechange = () => {
        const state = this.peerConnection.connectionState;
        console.log('Connection state:', state);
        
        if (this.onConnectionStateChange) {
          this.onConnectionStateChange(state);
        }
        
        // Handle failed connection
        if (state === 'failed') {
          console.error('WebRTC connection failed - may need TURN relay');
        }
      };

      // Handle ICE connection state changes - more detailed logging
      this.peerConnection.oniceconnectionstatechange = () => {
        const state = this.peerConnection.iceConnectionState;
        console.log('ICE connection state:', state);
        
        if (state === 'failed') {
          console.error('ICE connection failed - attempting restart');
          // Trigger ICE restart with renegotiation
          if (this.onIceRestart) {
            this.onIceRestart();
          }
        } else if (state === 'disconnected') {
          console.warn('ICE disconnected - waiting for reconnection');
          // Set a timeout to restart if still disconnected
          setTimeout(() => {
            if (this.peerConnection && this.peerConnection.iceConnectionState === 'disconnected') {
              console.log('Still disconnected after timeout, triggering restart');
              if (this.onIceRestart) {
                this.onIceRestart();
              }
            }
          }, 5000);
        } else if (state === 'connected' || state === 'completed') {
          console.log('ICE connection established successfully');
        }
      };

      // Handle incoming tracks (for viewer)
      this.peerConnection.ontrack = (event) => {
        console.log('Received remote track:', event.track.kind);
        this.remoteStream = event.streams[0];
        
        if (this.onRemoteStream) {
          this.onRemoteStream(this.remoteStream);
        }
      };

      // Set up data channel for control events
      if (isHost) {
        // Host creates the data channel
        this.dataChannel = this.peerConnection.createDataChannel('control', {
          ordered: true
        });
        this.setupDataChannelHandlers();
      } else {
        // Viewer receives the data channel
        this.peerConnection.ondatachannel = (event) => {
          this.dataChannel = event.channel;
          this.setupDataChannelHandlers();
        };
      }

      return this.peerConnection;
    } catch (error) {
      console.error('Failed to create peer connection:', error);
      if (this.onError) this.onError(error);
      throw error;
    }
  }

  /**
   * Restart ICE connection
   */
  restartIce() {
    if (this.peerConnection && this.peerConnection.restartIce) {
      console.log('Restarting ICE...');
      this.peerConnection.restartIce();
    }
  }

  /**
   * Set up data channel event handlers
   */
  setupDataChannelHandlers() {
    if (!this.dataChannel) return;

    this.dataChannel.onopen = () => {
      console.log('Data channel opened');
    };

    this.dataChannel.onclose = () => {
      console.log('Data channel closed');
    };

    this.dataChannel.onerror = (error) => {
      console.error('Data channel error:', error);
    };

    this.dataChannel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (this.onDataChannelMessage) {
          this.onDataChannelMessage(data);
        }
      } catch (error) {
        console.error('Failed to parse data channel message:', error);
      }
    };
  }

  /**
   * Start screen capture (host only)
   * @param {Object} options - Screen capture options
   * @returns {MediaStream} The captured screen stream
   */
  async startScreenCapture(options = {}) {
    try {
      const constraints = {
        video: {
          cursor: 'always',
          displaySurface: 'monitor',
          ...options.video
        },
        audio: options.audio || false
      };

      // Use getDisplayMedia for screen capture
      this.localStream = await navigator.mediaDevices.getDisplayMedia(constraints);

      // Handle stream ending (user stops sharing)
      this.localStream.getVideoTracks()[0].onended = () => {
        console.log('Screen sharing ended by user');
        this.stopScreenCapture();
      };

      return this.localStream;
    } catch (error) {
      console.error('Failed to start screen capture:', error);
      if (this.onError) this.onError(error);
      throw error;
    }
  }

  /**
   * Stop screen capture
   */
  stopScreenCapture() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
  }

  /**
   * Add local stream to peer connection
   */
  addStreamToPeerConnection() {
    if (!this.localStream || !this.peerConnection) {
      throw new Error('No local stream or peer connection');
    }

    this.localStream.getTracks().forEach((track) => {
      this.peerConnection.addTrack(track, this.localStream);
    });
  }

  /**
   * Create an offer (host)
   * @returns {RTCSessionDescriptionInit} The SDP offer
   */
  async createOffer() {
    if (!this.peerConnection) {
      throw new Error('No peer connection');
    }

    try {
      const offer = await this.peerConnection.createOffer({
        offerToReceiveVideo: true,
        offerToReceiveAudio: true
      });

      await this.peerConnection.setLocalDescription(offer);

      return this.peerConnection.localDescription;
    } catch (error) {
      console.error('Failed to create offer:', error);
      if (this.onError) this.onError(error);
      throw error;
    }
  }

  /**
   * Handle received offer (viewer)
   * @param {RTCSessionDescriptionInit} offer - The received offer
   * @returns {RTCSessionDescriptionInit} The SDP answer
   */
  async handleOffer(offer) {
    if (!this.peerConnection) {
      throw new Error('No peer connection');
    }

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      
      // Process any pending ICE candidates
      await this.processPendingCandidates();

      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      return this.peerConnection.localDescription;
    } catch (error) {
      console.error('Failed to handle offer:', error);
      if (this.onError) this.onError(error);
      throw error;
    }
  }

  /**
   * Handle received answer (host)
   * @param {RTCSessionDescriptionInit} answer - The received answer
   */
  async handleAnswer(answer) {
    if (!this.peerConnection) {
      throw new Error('No peer connection');
    }

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      
      // Process any pending ICE candidates
      await this.processPendingCandidates();
    } catch (error) {
      console.error('Failed to handle answer:', error);
      if (this.onError) this.onError(error);
      throw error;
    }
  }

  /**
   * Add ICE candidate
   * @param {RTCIceCandidateInit} candidate - The ICE candidate
   */
  async addIceCandidate(candidate) {
    if (!this.peerConnection) {
      throw new Error('No peer connection');
    }

    try {
      // If remote description is not set yet, queue the candidate
      if (!this.peerConnection.remoteDescription) {
        this.pendingCandidates.push(candidate);
        return;
      }

      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      // Ignore errors for candidates that can't be added
      console.warn('Failed to add ICE candidate:', error);
    }
  }

  /**
   * Process pending ICE candidates
   */
  async processPendingCandidates() {
    for (const candidate of this.pendingCandidates) {
      try {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.warn('Failed to add pending ICE candidate:', error);
      }
    }
    this.pendingCandidates = [];
  }

  /**
   * Send control event through data channel
   * @param {Object} event - Control event data
   */
  sendControlEvent(event) {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      console.warn('Data channel not open');
      return false;
    }

    try {
      this.dataChannel.send(JSON.stringify(event));
      return true;
    } catch (error) {
      console.error('Failed to send control event:', error);
      return false;
    }
  }

  /**
   * Get connection statistics
   * @returns {Object} Connection stats
   */
  async getStats() {
    if (!this.peerConnection) return null;

    try {
      const stats = await this.peerConnection.getStats();
      const result = {
        bytesReceived: 0,
        bytesSent: 0,
        packetsLost: 0,
        roundTripTime: 0
      };

      stats.forEach((report) => {
        if (report.type === 'inbound-rtp' && report.kind === 'video') {
          result.bytesReceived = report.bytesReceived || 0;
          result.packetsLost = report.packetsLost || 0;
        }
        if (report.type === 'outbound-rtp' && report.kind === 'video') {
          result.bytesSent = report.bytesSent || 0;
        }
        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          result.roundTripTime = report.currentRoundTripTime || 0;
        }
      });

      return result;
    } catch (error) {
      console.error('Failed to get stats:', error);
      return null;
    }
  }

  /**
   * Close the peer connection
   */
  close() {
    // Close data channel
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    // Stop local stream
    this.stopScreenCapture();

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Clear remote stream
    this.remoteStream = null;

    // Clear pending candidates
    this.pendingCandidates = [];
  }

  /**
   * Get connection state
   */
  getConnectionState() {
    return this.peerConnection?.connectionState || 'closed';
  }

  /**
   * Check if data channel is open
   */
  isDataChannelOpen() {
    return this.dataChannel?.readyState === 'open';
  }
}

export default WebRTCManager;
