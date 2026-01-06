/**
 * Viewer Session Page - Chrome Remote Desktop Style
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FiMonitor, 
  FiMaximize2,
  FiMinimize2,
  FiX,
  FiMousePointer,
  FiWifi,
  FiWifiOff,
  FiRefreshCw,
  FiEye
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useWebRTC, useSocket } from '../hooks';
import { useDeviceStore, useSessionStore } from '../store';

// Remote Screen Component
const RemoteScreen = ({ stream, onMouseEvent, onKeyEvent, controlEnabled, hostAllowsControl }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [videoSize, setVideoSize] = useState({ width: 1920, height: 1080 });

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const getRelativeCoords = useCallback((e) => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const relX = Math.max(0, Math.min(1, x / rect.width));
    const relY = Math.max(0, Math.min(1, y / rect.height));
    return { 
      x: Math.round(relX * videoSize.width), 
      y: Math.round(relY * videoSize.height),
      relX, relY,
      videoWidth: videoSize.width,
      videoHeight: videoSize.height
    };
  }, [videoSize]);

  const handleMouseEvent = useCallback((type) => (e) => {
    if (!controlEnabled || !hostAllowsControl) return;
    const coords = getRelativeCoords(e);
    if (coords) {
      onMouseEvent?.({ type, ...coords, button: e.button, deltaX: e.deltaX, deltaY: e.deltaY });
    }
  }, [controlEnabled, hostAllowsControl, getRelativeCoords, onMouseEvent]);

  useEffect(() => {
    const handleKey = (type) => (e) => {
      if (!controlEnabled || !hostAllowsControl) return;
      if (document.activeElement?.tagName === 'INPUT') return;
      e.preventDefault();
      onKeyEvent?.({
        type, key: e.key, code: e.code, keyCode: e.keyCode,
        ctrlKey: e.ctrlKey, shiftKey: e.shiftKey, altKey: e.altKey, metaKey: e.metaKey
      });
    };

    if (controlEnabled && hostAllowsControl) {
      document.addEventListener('keydown', handleKey('keydown'));
      document.addEventListener('keyup', handleKey('keyup'));
    }
    return () => {
      document.removeEventListener('keydown', handleKey('keydown'));
      document.removeEventListener('keyup', handleKey('keyup'));
    };
  }, [controlEnabled, hostAllowsControl, onKeyEvent]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoSize({ 
        width: videoRef.current.videoWidth || 1920, 
        height: videoRef.current.videoHeight || 1080 
      });
    }
  };

  const isInteractive = controlEnabled && hostAllowsControl;

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-black rounded-lg overflow-hidden"
      style={{ cursor: isInteractive ? 'crosshair' : 'default' }}
      tabIndex={0}
      onMouseMove={handleMouseEvent('mousemove')}
      onMouseDown={handleMouseEvent('mousedown')}
      onMouseUp={handleMouseEvent('mouseup')}
      onClick={handleMouseEvent('click')}
      onDoubleClick={handleMouseEvent('dblclick')}
      onContextMenu={(e) => { e.preventDefault(); handleMouseEvent('contextmenu')(e); }}
      onWheel={handleMouseEvent('scroll')}
    >
      {stream ? (
        <video
          ref={videoRef}
          autoPlay playsInline muted
          onLoadedMetadata={handleLoadedMetadata}
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <div className="text-center">
            <FiMonitor className="w-12 h-12 text-[#6b6b7b] mx-auto mb-4 animate-pulse" />
            <p className="text-[#6b6b7b]">Waiting for screen share...</p>
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
  const [hostAllowsControl, setHostAllowsControl] = useState(true);
  const [isConnecting, setIsConnecting] = useState(true);
  
  const screenContainerRef = useRef(null);
  const hasAttemptedRef = useRef(false);
  
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

  useEffect(() => {
    if (!currentDevice) getOrCreateDevice();
  }, [currentDevice, getOrCreateDevice]);

  useEffect(() => {
    if (socketConnected && currentDevice?.deviceId) {
      registerDevice(currentDevice.deviceId);
    }
  }, [socketConnected, currentDevice, registerDevice]);

  useEffect(() => {
    const handleControlModeChange = ({ controlMode }) => {
      const allowed = controlMode === 'full-control';
      setHostAllowsControl(allowed);
      toast(allowed ? 'Host enabled full control' : 'Host set to view only', { icon: allowed ? '✓' : '👁️' });
    };
    on('control-mode-change', handleControlModeChange);
    return () => off('control-mode-change', handleControlModeChange);
  }, [on, off]);

  useEffect(() => {
    const connectToSession = async () => {
      if (hasAttemptedRef.current || !sessionCode || !currentDevice || !socketConnected) return;
      hasAttemptedRef.current = true;
      
      try {
        const result = await startViewing(sessionCode);
        if (result) setIsConnecting(false);
      } catch (error) {
        toast.error(error.message || 'Failed to connect');
        setIsConnecting(false);
        hasAttemptedRef.current = false;
      }
    };
    connectToSession();
  }, [sessionCode, currentDevice, socketConnected, startViewing]);

  useEffect(() => {
    if (webrtcError) toast.error(webrtcError);
  }, [webrtcError]);

  useEffect(() => {
    const handleHostDisconnect = () => {
      toast.error('Host ended the session');
      navigate('/join');
    };
    on('host-disconnected', handleHostDisconnect);
    return () => off('host-disconnected', handleHostDisconnect);
  }, [on, off, navigate]);

  const handleDisconnect = useCallback(async () => {
    try {
      await endConnection();
      if (sessionCode) await leaveSession(sessionCode);
      toast.success('Disconnected');
      navigate('/join');
    } catch (error) {
      navigate('/join');
    }
  }, [endConnection, leaveSession, sessionCode, navigate]);

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

  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  const handleMouseEvent = useCallback((event) => {
    if (!controlEnabled || !hostAllowsControl) return;
    sendControlEvent({ type: 'mouse', ...event });
  }, [controlEnabled, hostAllowsControl, sendControlEvent]);

  const handleKeyEvent = useCallback((event) => {
    if (!controlEnabled || !hostAllowsControl) return;
    sendControlEvent({ type: 'keyboard', ...event });
  }, [controlEnabled, hostAllowsControl, sendControlEvent]);

  useEffect(() => {
    return () => { endConnection(); };
  }, [endConnection]);

  // Loading
  if (isConnecting || connectionState === 'connecting') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#2d2d4a] border-t-[#4285f4] rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Connecting...</h2>
          <p className="text-[#a0a0b0]">Session: <span className="font-mono text-[#4285f4]">{sessionCode}</span></p>
        </div>
      </div>
    );
  }

  // Connection Failed
  if (connectionState === 'failed' || (connectionState === 'disconnected' && !isConnecting)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center glass-card p-8 max-w-md">
          <div className="w-16 h-16 rounded-full bg-[#ea4335]/20 flex items-center justify-center mx-auto mb-4">
            <FiWifiOff className="w-8 h-8 text-[#ea4335]" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Connection Lost</h2>
          <p className="text-[#a0a0b0] mb-6">{webrtcError || 'The connection was lost. Make sure the host is sharing.'}</p>
          <div className="flex justify-center gap-3">
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-[#2a2a4a] text-white rounded-lg flex items-center gap-2">
              <FiRefreshCw className="w-4 h-4" /> Retry
            </button>
            <button onClick={() => navigate('/join')} className="px-4 py-2 bg-[#4285f4] text-white rounded-lg">
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FiMonitor className="w-5 h-5 text-[#4285f4]" />
            Remote Session
          </h1>
          <p className="text-[#a0a0b0] text-sm">Code: <span className="font-mono text-[#4285f4]">{sessionCode}</span></p>
        </div>
        
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${hostAllowsControl ? 'bg-[#a855f7]/20 text-[#c084fc]' : 'bg-[#4285f4]/20 text-[#8ab4f8]'}`}>
            {hostAllowsControl ? <><FiMousePointer className="w-3 h-3" /> Control</> : <><FiEye className="w-3 h-3" /> View Only</>}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${connectionState === 'connected' ? 'bg-[#34a853]/20 text-[#34a853]' : 'bg-[#fbbc04]/20 text-[#fbbc04]'}`}>
            <FiWifi className="w-3 h-3" /> {connectionState === 'connected' ? 'Connected' : 'Connecting'}
          </span>
        </div>
      </div>

      {/* Video Container */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {hostAllowsControl && (
              <button
                onClick={() => setControlEnabled(!controlEnabled)}
                className={`p-2 rounded-lg transition-all ${controlEnabled ? 'bg-[#a855f7]/20 text-[#c084fc]' : 'bg-[#2a2a4a] text-[#6b6b7b]'}`}
              >
                {controlEnabled ? <FiMousePointer className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
              </button>
            )}
            <span className="text-sm text-[#a0a0b0]">
              {!hostAllowsControl ? 'View Only (Host)' : controlEnabled ? 'Control Enabled' : 'View Only'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={toggleFullscreen} className="p-2 rounded-lg bg-[#2a2a4a] text-[#a0a0b0] hover:text-white transition-colors">
              {isFullscreen ? <FiMinimize2 className="w-5 h-5" /> : <FiMaximize2 className="w-5 h-5" />}
            </button>
            <button onClick={handleDisconnect} className="p-2 rounded-lg bg-[#ea4335]/20 text-[#ea4335] hover:bg-[#ea4335]/30 transition-colors">
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div ref={screenContainerRef} className={`${isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'aspect-video rounded-lg overflow-hidden'}`}>
          <RemoteScreen
            stream={remoteStream}
            onMouseEvent={handleMouseEvent}
            onKeyEvent={handleKeyEvent}
            controlEnabled={controlEnabled}
            hostAllowsControl={hostAllowsControl}
          />
          
          {isFullscreen && (
            <div className="absolute top-4 right-4 flex gap-2 opacity-30 hover:opacity-100 transition-opacity">
              <button onClick={toggleFullscreen} className="p-2 rounded-lg bg-black/50 text-white">
                <FiMinimize2 className="w-5 h-5" />
              </button>
              <button onClick={handleDisconnect} className="p-2 rounded-lg bg-[#ea4335]/50 text-white">
                <FiX className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ViewerSession;
