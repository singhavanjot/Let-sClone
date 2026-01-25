/**
 * Viewer Session Page - Modern Clean Design
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiMonitor, 
  FiMaximize2,
  FiMinimize2,
  FiX,
  FiMousePointer,
  FiWifi,
  FiWifiOff,
  FiActivity,
  FiRefreshCw,
  FiLock,
  FiUnlock,
  FiEye
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../components';
import { useWebRTC, useSocket } from '../hooks';
import { useDeviceStore, useSessionStore } from '../store';

// Stats Panel
const StatsPanel = ({ stats }) => (
  <div className="glass-card p-4">
    <h3 className="text-sm font-medium text-gray-400 mb-3">Connection Stats</h3>
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-gray-500 text-sm">Latency</span>
        <span className="text-white font-mono text-sm">{stats.latency || '--'}ms</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-gray-500 text-sm">Quality</span>
        <span className="text-emerald-400 font-mono text-sm">{stats.quality || 'Good'}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-gray-500 text-sm">Resolution</span>
        <span className="text-white font-mono text-sm">{stats.resolution || '1920x1080'}</span>
      </div>
    </div>
  </div>
);

// Interactive Remote Screen Component
const InteractiveRemoteScreen = ({ 
  stream, 
  onMouseEvent, 
  onKeyEvent, 
  controlEnabled,
  hostAllowsControl,
  isFullscreen 
}) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [videoSize, setVideoSize] = useState({ width: 1920, height: 1080 });
  const lastMouseMoveRef = useRef(0);
  const MOUSE_MOVE_THROTTLE = 16; // ~60fps throttle for mouse move events

  // Attach stream to video
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Get relative coordinates with video dimensions for proper host-side mapping
  const getRelativeCoords = useCallback((e) => {
    if (!containerRef.current || !videoRef.current) return null;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert to relative coordinates (0-1)
    const relX = Math.max(0, Math.min(1, x / rect.width));
    const relY = Math.max(0, Math.min(1, y / rect.height));
    
    // Convert to video coordinates
    const videoX = Math.round(relX * videoSize.width);
    const videoY = Math.round(relY * videoSize.height);
    
    // Include video dimensions for host-side coordinate mapping
    return { 
      x: videoX, 
      y: videoY, 
      relX, 
      relY,
      videoWidth: videoSize.width,
      videoHeight: videoSize.height
    };
  }, [videoSize]);

  // Mouse handlers with throttling for move events
  const handleMouseMove = useCallback((e) => {
    if (!controlEnabled || !hostAllowsControl) return;
    
    // Throttle mouse move events to ~60fps
    const now = Date.now();
    if (now - lastMouseMoveRef.current < MOUSE_MOVE_THROTTLE) return;
    lastMouseMoveRef.current = now;
    
    const coords = getRelativeCoords(e);
    if (coords) {
      onMouseEvent?.({ type: 'mousemove', ...coords, timestamp: now });
    }
  }, [controlEnabled, hostAllowsControl, getRelativeCoords, onMouseEvent]);

  const handleMouseDown = useCallback((e) => {
    if (!controlEnabled || !hostAllowsControl) return;
    e.preventDefault();
    const coords = getRelativeCoords(e);
    if (coords) {
      onMouseEvent?.({ type: 'mousedown', ...coords, button: e.button, timestamp: Date.now() });
    }
  }, [controlEnabled, hostAllowsControl, getRelativeCoords, onMouseEvent]);

  const handleMouseUp = useCallback((e) => {
    if (!controlEnabled || !hostAllowsControl) return;
    e.preventDefault();
    const coords = getRelativeCoords(e);
    if (coords) {
      onMouseEvent?.({ type: 'mouseup', ...coords, button: e.button, timestamp: Date.now() });
    }
  }, [controlEnabled, hostAllowsControl, getRelativeCoords, onMouseEvent]);

  const handleClick = useCallback((e) => {
    if (!controlEnabled || !hostAllowsControl) return;
    e.preventDefault();
    const coords = getRelativeCoords(e);
    if (coords) {
      onMouseEvent?.({ type: 'click', ...coords, button: e.button, timestamp: Date.now() });
    }
  }, [controlEnabled, hostAllowsControl, getRelativeCoords, onMouseEvent]);

  const handleDoubleClick = useCallback((e) => {
    if (!controlEnabled || !hostAllowsControl) return;
    e.preventDefault();
    const coords = getRelativeCoords(e);
    if (coords) {
      onMouseEvent?.({ type: 'dblclick', ...coords, button: e.button, timestamp: Date.now() });
    }
  }, [controlEnabled, hostAllowsControl, getRelativeCoords, onMouseEvent]);

  const handleContextMenu = useCallback((e) => {
    if (!controlEnabled || !hostAllowsControl) return;
    e.preventDefault();
    const coords = getRelativeCoords(e);
    if (coords) {
      onMouseEvent?.({ type: 'contextmenu', ...coords, timestamp: Date.now() });
    }
  }, [controlEnabled, hostAllowsControl, getRelativeCoords, onMouseEvent]);

  const handleWheel = useCallback((e) => {
    if (!controlEnabled || !hostAllowsControl) return;
    e.preventDefault();
    const coords = getRelativeCoords(e);
    if (coords) {
      onMouseEvent?.({ 
        type: 'scroll', 
        ...coords, 
        deltaX: e.deltaX, 
        deltaY: e.deltaY, 
        timestamp: Date.now() 
      });
    }
  }, [controlEnabled, hostAllowsControl, getRelativeCoords, onMouseEvent]);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!controlEnabled || !hostAllowsControl) return;
      if (document.activeElement?.tagName === 'INPUT' || 
          document.activeElement?.tagName === 'TEXTAREA') return;
      
      e.preventDefault();
      onKeyEvent?.({
        type: 'keydown',
        key: e.key,
        code: e.code,
        keyCode: e.keyCode,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        metaKey: e.metaKey,
        timestamp: Date.now()
      });
    };

    const handleKeyUp = (e) => {
      if (!controlEnabled || !hostAllowsControl) return;
      if (document.activeElement?.tagName === 'INPUT' || 
          document.activeElement?.tagName === 'TEXTAREA') return;
      
      e.preventDefault();
      onKeyEvent?.({
        type: 'keyup',
        key: e.key,
        code: e.code,
        keyCode: e.keyCode,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        metaKey: e.metaKey,
        timestamp: Date.now()
      });
    };

    if (controlEnabled && hostAllowsControl) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keyup', handleKeyUp);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [controlEnabled, hostAllowsControl, onKeyEvent]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const width = videoRef.current.videoWidth || 1920;
      const height = videoRef.current.videoHeight || 1080;
      console.log(`Video stream size: ${width}x${height}`);
      setVideoSize({ width, height });
    }
  };

  const isInteractive = controlEnabled && hostAllowsControl;

  // Focus the container when interactive to capture keyboard events
  useEffect(() => {
    if (isInteractive && containerRef.current) {
      containerRef.current.focus();
    }
  }, [isInteractive]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-black rounded-lg overflow-hidden"
      style={{ cursor: isInteractive ? 'crosshair' : 'default' }}
      tabIndex={0}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onWheel={handleWheel}
    >
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onLoadedMetadata={handleLoadedMetadata}
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
              <FiMonitor className="w-8 h-8 text-gray-500 animate-pulse" />
            </div>
            <p className="text-gray-400">Waiting for screen share...</p>
          </div>
        </div>
      )}
    </div>
  );
};

function ViewerSession() {
  const { sessionCode } = useParams();
  const navigate = useNavigate();
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlEnabled, setControlEnabled] = useState(true);
  const [hostAllowsControl, setHostAllowsControl] = useState(true); // Host's control mode
  const [isConnecting, setIsConnecting] = useState(true);
  const [stats, setStats] = useState({});
  
  const screenContainerRef = useRef(null);
  
  const { currentDevice, getOrCreateDevice } = useDeviceStore();
  const { leaveSession } = useSessionStore();
  const { isConnected: socketConnected, registerDevice, on, off } = useSocket();
  
  const {
    connectionState,
    remoteStream,
    error: webrtcError,
    startViewing,
    endConnection,
    sendControlEvent
  } = useWebRTC(false);

  // Initialize device
  useEffect(() => {
    if (!currentDevice) {
      getOrCreateDevice();
    }
  }, [currentDevice, getOrCreateDevice]);

  // Register device with socket (use deviceId, not MongoDB _id)
  useEffect(() => {
    if (socketConnected && currentDevice?.deviceId) {
      registerDevice(currentDevice.deviceId);
    }
  }, [socketConnected, currentDevice, registerDevice]);

  // Listen for control mode changes from host
  useEffect(() => {
    const handleControlModeChange = ({ controlMode }) => {
      const allowed = controlMode === 'full-control';
      setHostAllowsControl(allowed);
      if (!allowed) {
        toast('Host switched to view-only mode', { icon: '👁️' });
      } else {
        toast.success('Host enabled full control');
      }
    };

    on('control-mode-change', handleControlModeChange);
    return () => off('control-mode-change', handleControlModeChange);
  }, [on, off]);

  // Track if we've already attempted connection
  const hasAttemptedRef = useRef(false);
  const connectionTimeoutRef = useRef(null);

  // Connect to session - only once
  useEffect(() => {
    const connectToSession = async () => {
      // Prevent multiple connection attempts
      if (hasAttemptedRef.current) {
        console.log('Already attempted connection, skipping');
        return;
      }
      
      if (!sessionCode || !currentDevice || !socketConnected) {
        return;
      }
      
      hasAttemptedRef.current = true;
      console.log('Attempting to connect to session:', sessionCode);
      
      try {
        const result = await startViewing(sessionCode);
        if (result) {
          setIsConnecting(false);
          
          // Set timeout for connection - if not connected in 30s, show error
          connectionTimeoutRef.current = setTimeout(() => {
            console.log('Connection timeout - no connection established');
            toast.error('Connection timeout. The host may not be sharing their screen or network restrictions are blocking the connection.');
          }, 30000);
        }
      } catch (error) {
        console.error('Failed to connect:', error);
        toast.error(error.message || 'Failed to connect to session');
        setIsConnecting(false);
        hasAttemptedRef.current = false; // Allow retry on error
      }
    };

    connectToSession();
    
    return () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
    };
  }, [sessionCode, currentDevice, socketConnected, startViewing]);

  // Listen for socket errors (e.g., host not connected)
  useEffect(() => {
    const handleSocketError = ({ message }) => {
      console.error('Socket error:', message);
      toast.error(message || 'Connection error');
      if (message?.includes('Host is not connected')) {
        toast('Please wait for the host to start the session', { icon: '⏳' });
      }
    };

    on('error', handleSocketError);
    return () => off('error', handleSocketError);
  }, [on, off]);

  // Handle WebRTC errors
  useEffect(() => {
    if (webrtcError) {
      toast.error(webrtcError);
    }
  }, [webrtcError]);

  // Listen for host disconnect
  useEffect(() => {
    const handleHostDisconnect = () => {
      toast.error('Host ended the session');
      navigate('/join');
    };

    on('host-disconnected', handleHostDisconnect);
    return () => off('host-disconnected', handleHostDisconnect);
  }, [on, off, navigate]);

  // Disconnect handler
  const handleDisconnect = useCallback(async () => {
    try {
      await endConnection();
      if (sessionCode) {
        await leaveSession(sessionCode);
      }
      toast.success('Disconnected from session');
      navigate('/join');
    } catch (error) {
      console.error('Disconnect error:', error);
      navigate('/join');
    }
  }, [endConnection, leaveSession, sessionCode, navigate]);

  // Fullscreen toggle - uses screen container for proper fullscreen
  const toggleFullscreen = useCallback(async () => {
    const elem = screenContainerRef.current;
    if (!elem) return;
    
    try {
      if (!document.fullscreenElement) {
        await elem.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Control event handlers
  const handleMouseEvent = useCallback((event) => {
    if (!controlEnabled || !hostAllowsControl) return;
    sendControlEvent({
      type: 'mouse',
      ...event
    });
  }, [controlEnabled, hostAllowsControl, sendControlEvent]);

  const handleKeyEvent = useCallback((event) => {
    if (!controlEnabled || !hostAllowsControl) return;
    sendControlEvent({
      type: 'keyboard',
      ...event
    });
  }, [controlEnabled, hostAllowsControl, sendControlEvent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endConnection();
    };
  }, [endConnection]);

  // Loading state
  if (isConnecting || connectionState === 'connecting') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 mx-auto mb-6"
          />
          <h2 className="text-xl font-semibold text-white mb-2">Connecting...</h2>
          <p className="text-gray-400">Establishing secure connection to session</p>
          <p className="text-indigo-400 font-mono mt-4">{sessionCode}</p>
        </div>
      </div>
    );
  }

  // Connection failed - only show after we've actually tried to connect
  // Don't show on initial 'disconnected' state
  const hasAttemptedConnection = connectionState !== 'disconnected' || !isConnecting;
  const connectionFailed = hasAttemptedConnection && 
    (connectionState === 'failed' || (connectionState === 'disconnected' && !isConnecting));
  
  if (connectionFailed) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center glass-card p-8 max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <FiWifiOff className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Connection Lost</h2>
          <p className="text-gray-400 mb-6">
            {webrtcError || 'The connection to the remote session was lost. Make sure the host has started screen sharing.'}
          </p>
          <div className="flex justify-center space-x-4">
            <motion.button
              onClick={() => window.location.reload()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-secondary inline-flex items-center space-x-2"
            >
              <FiRefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </motion.button>
            <motion.button
              onClick={() => navigate('/join')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary"
            >
              Back to Join
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Control Permission Banner */}
      {connectionState === 'connected' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl border ${
            hostAllowsControl 
              ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30' 
              : 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                hostAllowsControl 
                  ? 'bg-purple-500/20' 
                  : 'bg-cyan-500/20'
              }`}>
                {hostAllowsControl 
                  ? <FiMousePointer className="w-5 h-5 text-purple-400" />
                  : <FiEye className="w-5 h-5 text-cyan-400" />
                }
              </div>
              <div>
                <p className={`font-semibold ${hostAllowsControl ? 'text-purple-400' : 'text-cyan-400'}`}>
                  {hostAllowsControl ? '🎮 Remote Control Enabled' : '👁️ View Only Mode'}
                </p>
                <p className="text-gray-400 text-sm">
                  {hostAllowsControl 
                    ? 'You can control the host\'s mouse and keyboard' 
                    : 'Host has restricted control. You can only view the screen.'
                  }
                </p>
              </div>
            </div>
            {hostAllowsControl && (
              <motion.button
                onClick={() => setControlEnabled(!controlEnabled)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  controlEnabled 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                {controlEnabled ? 'Control ON' : 'Control OFF'}
              </motion.button>
            )}
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center">
            <FiMonitor className="w-5 h-5 mr-2 text-indigo-400" />
            Remote Session
          </h1>
          <p className="text-gray-400 mt-1">
            Session Code: <span className="font-mono text-indigo-400">{sessionCode}</span>
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Host Control Mode Badge */}
          <div className={`badge ${hostAllowsControl ? 'badge-success' : 'badge-warning'}`}>
            {hostAllowsControl ? (
              <>
                <FiUnlock className="w-3 h-3 mr-2" />
                Control Allowed
              </>
            ) : (
              <>
                <FiEye className="w-3 h-3 mr-2" />
                View Only
              </>
            )}
          </div>
          
          <div className={`badge ${connectionState === 'connected' ? 'badge-success' : 'badge-warning'}`}>
            {connectionState === 'connected' ? (
              <>
                <FiWifi className="w-3 h-3 mr-2" />
                Connected
              </>
            ) : (
              <>
                <FiActivity className="w-3 h-3 mr-2 animate-pulse" />
                Connecting
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-4 gap-4">
        {/* Video Container */}
        <div className="lg:col-span-3">
          <div className="glass-card p-4">
            {/* Video Controls */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                {hostAllowsControl ? (
                  <motion.button
                    onClick={() => setControlEnabled(!controlEnabled)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-2 rounded-lg transition-all ${
                      controlEnabled 
                        ? 'bg-purple-500/20 text-purple-400' 
                        : 'bg-gray-700/50 text-gray-500'
                    }`}
                    title={controlEnabled ? 'Disable Control' : 'Enable Control'}
                  >
                    {controlEnabled ? <FiMousePointer className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                  </motion.button>
                ) : (
                  <div className="p-2 rounded-lg bg-gray-700/50 text-gray-500">
                    <FiLock className="w-5 h-5" />
                  </div>
                )}
                <span className="text-sm text-gray-400">
                  {!hostAllowsControl 
                    ? 'Host set to View Only' 
                    : controlEnabled 
                      ? 'Control Enabled' 
                      : 'View Only'
                  }
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <motion.button
                  onClick={toggleFullscreen}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? <FiMinimize2 className="w-5 h-5" /> : <FiMaximize2 className="w-5 h-5" />}
                </motion.button>
                
                <motion.button
                  onClick={handleDisconnect}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-all"
                  title="Disconnect"
                >
                  <FiX className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
            
            {/* Remote Screen */}
            <div 
              ref={screenContainerRef}
              className={`screen-preview relative ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'aspect-video'}`}
            >
              <InteractiveRemoteScreen
                stream={remoteStream}
                onMouseEvent={handleMouseEvent}
                onKeyEvent={handleKeyEvent}
                controlEnabled={controlEnabled}
                hostAllowsControl={hostAllowsControl}
                isFullscreen={isFullscreen}
              />
              
              {/* Fullscreen exit button overlay */}
              {isFullscreen && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute top-4 right-4 flex items-center space-x-2 opacity-0 hover:opacity-100 transition-opacity duration-300"
                  style={{ opacity: 0.3 }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '0.3'}
                >
                  <motion.button
                    onClick={toggleFullscreen}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-lg bg-black/50 hover:bg-black/80 text-white transition-all backdrop-blur-sm"
                    title="Exit Fullscreen (ESC)"
                  >
                    <FiMinimize2 className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    onClick={handleDisconnect}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-lg bg-red-500/50 hover:bg-red-500/80 text-white transition-all backdrop-blur-sm"
                    title="Disconnect"
                  >
                    <FiX className="w-5 h-5" />
                  </motion.button>
                </motion.div>
              )}
              
              {controlEnabled && hostAllowsControl && connectionState === 'connected' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute bottom-4 left-4 flex items-center space-x-2 px-3 py-1.5 bg-purple-500/20 rounded-full border border-purple-500/30"
                >
                  <FiMousePointer className="w-3 h-3 text-purple-400" />
                  <span className="text-purple-400 text-xs font-medium">Control Active</span>
                </motion.div>
              )}
              
              {!hostAllowsControl && connectionState === 'connected' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute bottom-4 left-4 flex items-center space-x-2 px-3 py-1.5 bg-cyan-500/20 rounded-full border border-cyan-500/30"
                >
                  <FiEye className="w-3 h-3 text-cyan-400" />
                  <span className="text-cyan-400 text-xs font-medium">View Only Mode</span>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          <StatsPanel stats={stats} />
          
          {/* Quick Actions */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {hostAllowsControl && (
                <motion.button
                  onClick={() => setControlEnabled(!controlEnabled)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 text-left text-gray-300 text-sm flex items-center space-x-3 transition-all"
                >
                  {controlEnabled ? <FiEye className="w-4 h-4" /> : <FiMousePointer className="w-4 h-4" />}
                  <span>{controlEnabled ? 'Switch to View Only' : 'Enable Control'}</span>
                </motion.button>
              )}
              
              <motion.button
                onClick={toggleFullscreen}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 text-left text-gray-300 text-sm flex items-center space-x-3 transition-all"
              >
                <FiMaximize2 className="w-4 h-4" />
                <span>Toggle Fullscreen</span>
              </motion.button>
              
              <motion.button
                onClick={handleDisconnect}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-left text-red-400 text-sm flex items-center space-x-3 transition-all"
              >
                <FiX className="w-4 h-4" />
                <span>Disconnect</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewerSession;
