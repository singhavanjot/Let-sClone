/**
 * useWebRTC Hook
 * React hook for managing WebRTC connections
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import WebRTCManager from '../webrtc/WebRTCManager';
import { socketService } from '../services';
import { useAuthStore, useSessionStore } from '../store';

// Default ICE servers - STUN only as fallback
// TURN credentials are fetched dynamically from the backend (via Metered.ca API)
const DEFAULT_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
];
export function useWebRTC(isHost = false) {
  const [connectionState, setConnectionState] = useState('disconnected');
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isDataChannelOpen, setIsDataChannelOpen] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  const webrtcRef = useRef(null);
  const statsIntervalRef = useRef(null);
  const sessionCodeRef = useRef(null);
  const localStreamRef = useRef(null);
  
  const token = useAuthStore((state) => state.token);
  const setSessionConnectionState = useSessionStore((state) => state.setConnectionState);

  /**
   * Cleanup function - DEFINED FIRST so other functions can use it
   */
  const cleanup = useCallback(() => {
    console.log('Cleaning up WebRTC...');
    
    // Clear stats interval
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = null;
    }

    // Stop local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Close WebRTC connection
    if (webrtcRef.current) {
      webrtcRef.current.close();
      webrtcRef.current = null;
    }

    // Remove socket listeners
    socketService.off('webrtc:offer');
    socketService.off('webrtc:answer');
    socketService.off('webrtc:ice-candidate');
    socketService.off('viewer:joined');
    socketService.off('peer:disconnected');
    socketService.off('session:ended');
    socketService.off('config');
    socketService.off('ice-restart-requested');

    // Reset state
    setLocalStream(null);
    setRemoteStream(null);
    setConnectionState('disconnected');
    setIsDataChannelOpen(false);
    setStats(null);
    sessionCodeRef.current = null;
  }, []);

  /**
   * Initialize WebRTC manager
   */
  const initializeWebRTC = useCallback(async () => {
    try {
      // Connect socket if not connected
      if (!socketService.isSocketConnected()) {
        await socketService.connect(token);
      }

      // Create WebRTC manager if not exists
      if (!webrtcRef.current) {
        webrtcRef.current = new WebRTCManager();
      }
      
      // Set STUN-only defaults immediately (so we have something)
      webrtcRef.current.setIceServers(DEFAULT_ICE_SERVERS);

      // Wait for server to send TURN credentials (these are essential)
      await new Promise((resolve) => {
        let resolved = false;
        
        const handleConfig = (config) => {
          if (resolved) return;
          resolved = true;
          
          if (config.iceServers?.length > 0) {
            const turnCount = config.iceServers.filter(s => {
              const urls = Array.isArray(s.urls) ? s.urls : [s.urls];
              return urls.some(u => u?.includes('turn'));
            }).length;
            
            console.log(`✅ Received ICE config: ${config.iceServers.length} servers (${turnCount} TURN)`);
            
            if (turnCount === 0) {
              console.warn('⚠️ Server sent NO TURN servers! Cross-network connections will fail.');
              console.warn('Set METERED_API_KEY on the backend. Get free key at https://www.metered.ca/');
            }
            
            // Only set if webrtcRef still exists (might have been cleaned up)
            if (webrtcRef.current) {
              webrtcRef.current.setIceServers(config.iceServers);
            }
          }
          resolve();
        };

        // Listen for config (server sends it on connection + on request)
        socketService.on('config', handleConfig);
        
        // Explicitly request config in case we missed the auto-send
        socketService.emit('get-config');
        
        // Timeout after 5 seconds  
        setTimeout(() => {
          if (!resolved) {
            console.warn('⚠️ ICE config timeout - continuing with STUN only (no TURN)');
            console.warn('Cross-network connections may fail without TURN servers.');
            resolved = true;
            socketService.off('config', handleConfig);
            resolve();
          }
        }, 5000);
      });
      
      return true;
    } catch (err) {
      console.error('Initialize WebRTC error:', err);
      setError(err.message);
      throw err;
    }
  }, [token]);

  /**
   * Set up WebRTC event handlers
   */
  const setupEventHandlers = useCallback(() => {
    if (!webrtcRef.current) return;

    // Connection state change
    webrtcRef.current.onConnectionStateChange = (state) => {
      console.log('WebRTC connection state:', state);
      setConnectionState(state);
      setSessionConnectionState(state);
      if (sessionCodeRef.current) {
        socketService.sendConnectionState(sessionCodeRef.current, state);
      }
    };

    // ICE candidate
    webrtcRef.current.onIceCandidate = (candidate) => {
      if (sessionCodeRef.current) {
        socketService.sendIceCandidate(sessionCodeRef.current, candidate);
      }
    };

    // ICE restart handler (for failed connections)
    webrtcRef.current.onIceRestart = async () => {
      if (webrtcRef.current && sessionCodeRef.current) {
        try {
          if (isHost) {
            console.log('Host: Performing ICE restart with renegotiation...');
            // Create new offer with ICE restart flag
            const offer = await webrtcRef.current.peerConnection.createOffer({ iceRestart: true });
            await webrtcRef.current.peerConnection.setLocalDescription(offer);
            socketService.sendOffer(sessionCodeRef.current, offer);
          } else {
            console.log('Viewer: Requesting ICE restart from host...');
            // Viewer requests host to restart ICE
            socketService.emit('request-ice-restart', { sessionCode: sessionCodeRef.current });
          }
        } catch (err) {
          console.error('ICE restart failed:', err);
        }
      }
    };

    // Remote stream (for viewer)
    webrtcRef.current.onRemoteStream = (stream) => {
      console.log('Received remote stream');
      setRemoteStream(stream);
    };

    // Data channel open
    webrtcRef.current.onDataChannelOpen = () => {
      setIsDataChannelOpen(true);
    };

    // Data channel message
    webrtcRef.current.onDataChannelMessage = (data) => {
      // Handle control events on host - forward to desktop agent
      if (isHost && sessionCodeRef.current) {
        console.log('Received control event, forwarding to agent:', data.type);
        socketService.forwardToAgent(sessionCodeRef.current, data);
      }
    };

    // Error handler
    webrtcRef.current.onError = (err) => {
      console.error('WebRTC error:', err);
      setError(err.message);
    };
  }, [isHost, setSessionConnectionState]);

  /**
   * Set up socket event handlers
   */
  const setupSocketHandlers = useCallback(() => {
    // Handle incoming offer (viewer)
    socketService.on('webrtc:offer', async ({ offer }) => {
      console.log('Received WebRTC offer');
      if (!isHost && webrtcRef.current) {
        try {
          // Check if we already have a peer connection in a valid state
          const pc = webrtcRef.current.peerConnection;
          if (pc && (pc.signalingState === 'stable' || pc.signalingState === 'have-local-offer')) {
            console.log('Ignoring duplicate offer - already connected or connecting');
            return;
          }
          
          // Only create new peer connection if we don't have one
          if (!pc || pc.signalingState === 'closed') {
            // Log the ICE servers being used
            console.log('Creating viewer peer connection with', webrtcRef.current.iceServers?.length, 'ICE servers');
            console.log('TURN servers included:', webrtcRef.current.iceServers?.filter(s => 
              s.urls?.toString().includes('turn:') || s.urls?.toString().includes('turns:')
            ).length);
            
            await webrtcRef.current.createPeerConnection(false);
            setupEventHandlers();
          }
          
          const answer = await webrtcRef.current.handleOffer(offer);
          socketService.sendAnswer(sessionCodeRef.current, answer);
          
          setConnectionState('connecting');
        } catch (err) {
          console.error('Handle offer error:', err);
          setError(err.message);
        }
      }
    });

    // Handle incoming answer (host)
    socketService.on('webrtc:answer', async ({ answer }) => {
      console.log('Received WebRTC answer');
      if (isHost && webrtcRef.current) {
        try {
          await webrtcRef.current.handleAnswer(answer);
        } catch (err) {
          console.error('Handle answer error:', err);
          setError(err.message);
        }
      }
    });

    // Handle ICE candidates
    socketService.on('webrtc:ice-candidate', async ({ candidate }) => {
      if (webrtcRef.current) {
        try {
          await webrtcRef.current.addIceCandidate(candidate);
        } catch (err) {
          console.warn('Failed to add ICE candidate:', err);
        }
      }
    });

    // Handle viewer joined (host)
    socketService.on('viewer:joined', async ({ viewerId, viewerEmail }) => {
      console.log('Viewer joined:', viewerEmail);
      if (isHost && webrtcRef.current) {
        try {
          // Check if we already sent an offer
          const pc = webrtcRef.current.peerConnection;
          if (pc && pc.signalingState !== 'stable' && pc.signalingState !== 'closed') {
            console.log('Ignoring duplicate viewer:joined - already negotiating');
            return;
          }
          
          // Create and send offer
          const offer = await webrtcRef.current.createOffer();
          socketService.sendOffer(sessionCodeRef.current, offer);
          
          setConnectionState('connecting');
        } catch (err) {
          console.error('Create offer error:', err);
          setError(err.message);
        }
      }
    });

    // Handle peer disconnected
    socketService.on('peer:disconnected', ({ isHost: wasHost }) => {
      if (wasHost) {
        setError('Host disconnected');
        setConnectionState('disconnected');
      } else {
        console.log('Viewer disconnected');
      }
    });

    // Handle ICE restart request from viewer (host only)
    socketService.on('ice-restart-requested', async () => {
      console.log('Received ICE restart request from viewer');
      if (isHost && webrtcRef.current && sessionCodeRef.current) {
        try {
          console.log('Host: Performing ICE restart...');
          const offer = await webrtcRef.current.peerConnection.createOffer({ iceRestart: true });
          await webrtcRef.current.peerConnection.setLocalDescription(offer);
          socketService.sendOffer(sessionCodeRef.current, offer);
        } catch (err) {
          console.error('ICE restart from request failed:', err);
        }
      }
    });

    // Handle session ended
    socketService.on('session:ended', () => {
      cleanup();
    });
  }, [isHost, setupEventHandlers, cleanup]);

  /**
   * Start hosting (host only)
   * @param {string} sessionCode - Session code for this session
   */
  const startHosting = useCallback(async (sessionCode) => {
    try {
      console.log('Starting host session:', sessionCode);
      
      // Store session code in ref for callbacks
      sessionCodeRef.current = sessionCode;
      
      // Initialize WebRTC
      await initializeWebRTC();
      
      // Start screen capture FIRST
      console.log('Requesting screen capture...');
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor'
        },
        audio: false
      });
      
      console.log('Screen capture started');
      
      // Store the stream in ref and state
      localStreamRef.current = stream;
      webrtcRef.current.localStream = stream;
      setLocalStream(stream);
      
      // Handle stream ending (user stops sharing)
      stream.getVideoTracks()[0].onended = () => {
        console.log('Screen sharing stopped by user');
        cleanup();
      };
      
      // Log ICE server configuration
      console.log('Creating host peer connection with', webrtcRef.current.iceServers?.length, 'ICE servers');
      console.log('TURN servers included:', webrtcRef.current.iceServers?.filter(s => 
        s.urls?.toString().includes('turn:') || s.urls?.toString().includes('turns:')
      ).length);
      
      // Create peer connection as host
      await webrtcRef.current.createPeerConnection(true);
      setupEventHandlers();

      // Add stream to peer connection
      stream.getTracks().forEach((track) => {
        webrtcRef.current.peerConnection.addTrack(track, stream);
      });

      // Create session room on signaling server
      console.log('Creating session room:', sessionCode);
      await socketService.createSession(sessionCode);
      
      // Set up socket handlers
      setupSocketHandlers();

      setConnectionState('waiting');
      
      return true;
    } catch (err) {
      console.error('Start hosting error:', err);
      setError(err.message || 'Failed to start screen sharing');
      return false;
    }
  }, [initializeWebRTC, setupEventHandlers, setupSocketHandlers, cleanup]);

  /**
   * Start viewing (viewer only)
   * @param {string} sessionCode - Session code to join
   */
  const startViewing = useCallback(async (sessionCode) => {
    try {
      console.log('Starting viewer session:', sessionCode);
      
      // Store session code in ref for callbacks
      sessionCodeRef.current = sessionCode;
      
      // Initialize WebRTC
      await initializeWebRTC();
      
      // Join session room on signaling server
      console.log('Joining session room:', sessionCode);
      await socketService.joinSession(sessionCode);
      
      // Set up socket handlers (will receive offer)
      setupSocketHandlers();

      setConnectionState('connecting');
      
      return true;
    } catch (err) {
      console.error('Start viewing error:', err);
      setError(err.message);
      return false;
    }
  }, [initializeWebRTC, setupSocketHandlers]);

  /**
   * Send control event (viewer only)
   */
  /**
   * Send control event (viewer only)
   */
  const sendControlEvent = useCallback((event) => {
    // Try data channel first for lower latency
    if (!isHost && webrtcRef.current?.isDataChannelOpen?.()) {
      console.log('Sending control event via data channel:', event.type);
      return webrtcRef.current.sendControlEvent(event);
    }
    
    // Fall back to socket for control events
    if (sessionCodeRef.current) {
      console.log('Sending control event via socket:', event.type);
      socketService.sendControlEvent(sessionCodeRef.current, event);
    }
    return true;
  }, [isHost]);

  /**
   * End connection
   */
  const endConnection = useCallback(async () => {
    try {
      if (sessionCodeRef.current) {
        await socketService.endSession(sessionCodeRef.current);
      }
    } catch (err) {
      console.error('Error ending session:', err);
    }
    cleanup();
  }, [cleanup]);

  /**
   * Start collecting stats
   */
  useEffect(() => {
    if (connectionState === 'connected' && webrtcRef.current) {
      statsIntervalRef.current = setInterval(async () => {
        if (webrtcRef.current) {
          const newStats = await webrtcRef.current.getStats();
          setStats(newStats);
        }
      }, 1000);
    }

    return () => {
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }
    };
  }, [connectionState]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    connectionState,
    localStream,
    remoteStream,
    isDataChannelOpen,
    error,
    stats,
    startHosting,
    startViewing,
    sendControlEvent,
    endConnection,
    cleanup
  };
}

export default useWebRTC;
