/**
 * Viewer Session Page
 * View and control a remote desktop
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FiX, 
  FiMaximize, 
  FiSettings,
  FiMousePointer,
  FiEye
} from 'react-icons/fi';
import toast from 'react-hot-toast';

import { 
  Card, 
  Button, 
  ConnectionStatus, 
  RemoteScreen,
  LoadingSpinner 
} from '../components';
import { useWebRTC, useSocket, useRemoteControl } from '../hooks';
import { useSessionStore, useDeviceStore } from '../store';

function ViewerSession() {
  const { sessionCode } = useParams();
  const navigate = useNavigate();
  
  const [controlMode, setControlMode] = useState('full'); // full, view-only
  const [showSettings, setShowSettings] = useState(false);
  const containerRef = useRef(null);

  const { currentDevice } = useDeviceStore();
  const { currentSession, endSession, getSession } = useSessionStore();
  const { isConnected: socketConnected, registerDevice, on, off } = useSocket();
  
  const {
    connectionState,
    remoteStream,
    error: webrtcError,
    stats,
    startViewing,
    sendControlEvent,
    endConnection
  } = useWebRTC(false);

  const {
    isEnabled: controlEnabled,
    initialize: initializeControl,
    setEnabled: setControlEnabled,
    updateVideoSize
  } = useRemoteControl();

  // Register device with socket
  useEffect(() => {
    if (socketConnected && currentDevice) {
      registerDevice(currentDevice.deviceId);
    }
  }, [socketConnected, currentDevice, registerDevice]);

  // Start viewing when component mounts
  useEffect(() => {
    const initSession = async () => {
      const success = await startViewing(sessionCode);
      if (!success) {
        toast.error('Failed to connect to session');
      }
    };

    if (sessionCode && socketConnected) {
      initSession();
    }
  }, [sessionCode, socketConnected, startViewing]);

  // Initialize remote control when container is ready
  const handleContainerRef = useCallback((element) => {
    if (element) {
      containerRef.current = element;
      initializeControl(element, (event) => {
        if (controlMode === 'full') {
          sendControlEvent(event);
        }
      });
    }
  }, [initializeControl, sendControlEvent, controlMode]);

  // Update video size when stream changes
  useEffect(() => {
    if (remoteStream) {
      const videoTrack = remoteStream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        updateVideoSize(settings.width || 1920, settings.height || 1080);
      }
    }
  }, [remoteStream, updateVideoSize]);

  // Listen for session events
  useEffect(() => {
    const handleSessionEnded = () => {
      toast('Session ended by host');
      navigate('/dashboard');
    };

    const handleHostDisconnected = ({ isHost }) => {
      if (isHost) {
        toast.error('Host disconnected');
        navigate('/dashboard');
      }
    };

    on('session:ended', handleSessionEnded);
    on('peer:disconnected', handleHostDisconnected);

    return () => {
      off('session:ended', handleSessionEnded);
      off('peer:disconnected', handleHostDisconnected);
    };
  }, [on, off, navigate]);

  // Handle WebRTC errors
  useEffect(() => {
    if (webrtcError) {
      toast.error(webrtcError);
    }
  }, [webrtcError]);

  // Handle disconnect
  const handleDisconnect = async () => {
    await endConnection();
    navigate('/dashboard');
    toast.success('Disconnected from session');
  };

  // Toggle control mode
  const toggleControlMode = () => {
    const newMode = controlMode === 'full' ? 'view-only' : 'full';
    setControlMode(newMode);
    setControlEnabled(newMode === 'full');
    toast.success(newMode === 'full' ? 'Full control enabled' : 'View-only mode');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endConnection();
    };
  }, [endConnection]);

  // Loading state
  if (connectionState === 'connecting' && !remoteStream) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="text-center py-12 px-16">
          <LoadingSpinner size="lg" className="mb-6" />
          <h2 className="text-xl font-semibold text-white mb-2">
            Connecting to Session
          </h2>
          <p className="text-gray-400">
            Session Code: <span className="font-mono">{sessionCode}</span>
          </p>
          <ConnectionStatus state={connectionState} className="mt-4" />
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-white">
            Session: <span className="font-mono text-primary-500">{sessionCode}</span>
          </h1>
          <ConnectionStatus state={connectionState} />
        </div>

        <div className="flex items-center space-x-2">
          {/* Stats */}
          {stats && connectionState === 'connected' && (
            <div className="hidden md:flex items-center space-x-4 text-xs text-gray-400 mr-4">
              <span>RTT: {Math.round((stats.roundTripTime || 0) * 1000)}ms</span>
              <span>Received: {formatBytes(stats.bytesReceived)}</span>
            </div>
          )}

          {/* Control Mode Toggle */}
          <Button
            variant={controlMode === 'full' ? 'primary' : 'secondary'}
            size="sm"
            icon={controlMode === 'full' ? FiMousePointer : FiEye}
            onClick={toggleControlMode}
          >
            {controlMode === 'full' ? 'Control' : 'View Only'}
          </Button>

          {/* Settings */}
          <Button
            variant="ghost"
            size="sm"
            icon={FiSettings}
            onClick={() => setShowSettings(!showSettings)}
          />

          {/* Disconnect */}
          <Button
            variant="danger"
            size="sm"
            icon={FiX}
            onClick={handleDisconnect}
          >
            Disconnect
          </Button>
        </div>
      </div>

      {/* Remote Screen */}
      <div className="flex-1 min-h-0">
        <RemoteScreen
          stream={remoteStream}
          onContainerRef={handleContainerRef}
          showControls={true}
          className="h-full"
        />
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card className="absolute bottom-20 right-4 w-72 z-10">
          <h3 className="font-medium text-white mb-4">Session Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Remote Control</span>
                <button
                  onClick={toggleControlMode}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full
                    transition-colors duration-200
                    ${controlMode === 'full' ? 'bg-primary-600' : 'bg-dark-600'}
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white
                      transition-transform duration-200
                      ${controlMode === 'full' ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>
              </label>
            </div>

            {/* Quality setting would go here */}
          </div>
        </Card>
      )}
    </div>
  );
}

// Helper function to format bytes
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default ViewerSession;
