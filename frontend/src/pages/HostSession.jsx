/**
 * Host Session Page
 * Start a new Let'sClone session as the host
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiMonitor, 
  FiShare2, 
  FiX,
  FiSettings,
  FiUsers,
  FiAlertCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';

import { 
  Card, 
  Button, 
  SessionCodeDisplay, 
  ConnectionStatus,
  RemoteScreen,
  LoadingSpinner
} from '../components';
import { useWebRTC, useSocket } from '../hooks';
import { useDeviceStore, useSessionStore } from '../store';
import { isScreenCaptureSupported } from '../webrtc';

function HostSession() {
  const [step, setStep] = useState('setup'); // setup, sharing, connected
  const [session, setSession] = useState(null);
  const [viewerInfo, setViewerInfo] = useState(null);
  
  const navigate = useNavigate();
  
  const { currentDevice, getOrCreateDevice, fetchDevices } = useDeviceStore();
  const { createSession, endSession, isLoading: sessionLoading } = useSessionStore();
  const { isConnected: socketConnected, registerDevice, on, off } = useSocket();
  
  const {
    connectionState,
    localStream,
    error: webrtcError,
    startHosting,
    endConnection
  } = useWebRTC(true);

  // Check browser support
  useEffect(() => {
    if (!isScreenCaptureSupported()) {
      toast.error('Screen capture is not supported in this browser');
      navigate('/dashboard');
    }
  }, [navigate]);

  // Load device
  useEffect(() => {
    const loadDevice = async () => {
      await fetchDevices();
      await getOrCreateDevice();
    };
    loadDevice();
  }, [fetchDevices, getOrCreateDevice]);

  // Register device with socket when connected
  useEffect(() => {
    if (socketConnected && currentDevice) {
      registerDevice(currentDevice.deviceId);
    }
  }, [socketConnected, currentDevice, registerDevice]);

  // Listen for viewer connection
  useEffect(() => {
    const handleViewerJoined = (data) => {
      setViewerInfo(data);
      setStep('connected');
      toast.success(`${data.viewerEmail} connected!`);
    };

    const handleViewerDisconnected = () => {
      setViewerInfo(null);
      setStep('sharing');
      toast('Viewer disconnected', { icon: '👋' });
    };

    on('viewer:joined', handleViewerJoined);
    on('peer:disconnected', handleViewerDisconnected);

    return () => {
      off('viewer:joined', handleViewerJoined);
      off('peer:disconnected', handleViewerDisconnected);
    };
  }, [on, off]);

  // Handle WebRTC errors
  useEffect(() => {
    if (webrtcError) {
      toast.error(webrtcError);
    }
  }, [webrtcError]);

  // Start sharing session
  const handleStartSharing = async () => {
    if (!currentDevice) {
      toast.error('No device registered');
      return;
    }

    try {
      // Create session in backend FIRST
      const result = await createSession(currentDevice.deviceId);
      
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      const newSession = result.session;
      setSession(newSession);

      // Start WebRTC and screen capture with the session code
      const success = await startHosting(newSession.sessionCode);
      
      if (success) {
        setStep('sharing');
        toast.success('Screen sharing started!');
      } else {
        toast.error('Failed to start screen sharing');
        // Clean up the session if screen capture failed
        await endSession(newSession.id);
        setSession(null);
      }
    } catch (error) {
      console.error('Start sharing error:', error);
      toast.error('Failed to start session');
    }
  };

  // Stop sharing session
  const handleStopSharing = async () => {
    try {
      await endConnection();
      
      if (session) {
        await endSession(session.id);
      }

      setSession(null);
      setViewerInfo(null);
      setStep('setup');
      
      toast.success('Session ended');
    } catch (error) {
      console.error('Stop sharing error:', error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (session) {
        endConnection();
        endSession(session.id);
      }
    };
  }, [session, endConnection, endSession]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Host Session</h1>
          <p className="text-gray-400 mt-1">
            Share your screen with remote viewers
          </p>
        </div>
        
        {step !== 'setup' && (
          <ConnectionStatus state={connectionState} />
        )}
      </div>

      {/* Setup Step */}
      {step === 'setup' && (
        <Card className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-center w-20 h-20 mx-auto rounded-2xl bg-primary-500/10 mb-6">
              <FiMonitor className="w-10 h-10 text-primary-500" />
            </div>
            
            <h2 className="text-xl font-semibold text-white mb-2">
              Ready to Share Your Screen?
            </h2>
            <p className="text-gray-400 mb-8">
              Start a session and share the code with anyone who needs to view
              or control your desktop remotely.
            </p>

            {!isScreenCaptureSupported() && (
              <div className="flex items-center justify-center p-4 mb-6 bg-red-500/10 rounded-lg">
                <FiAlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-500 text-sm">
                  Screen capture not supported in this browser
                </span>
              </div>
            )}

            <Button
              size="lg"
              icon={FiShare2}
              onClick={handleStartSharing}
              loading={sessionLoading}
              disabled={!currentDevice || !isScreenCaptureSupported()}
            >
              Start Sharing
            </Button>

            {!currentDevice && (
              <p className="text-sm text-gray-500 mt-4">
                Registering your device...
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Sharing Step */}
      {(step === 'sharing' || step === 'connected') && session && (
        <>
          {/* Session Code */}
          <Card className="text-center">
            <SessionCodeDisplay 
              code={session.sessionCode}
              label="Share this code with your viewer"
            />
            
            {step === 'sharing' && (
              <p className="text-gray-400 mt-4">
                <FiUsers className="inline w-4 h-4 mr-1" />
                Waiting for a viewer to connect...
              </p>
            )}

            {step === 'connected' && viewerInfo && (
              <div className="mt-4 p-3 bg-green-500/10 rounded-lg inline-flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 pulse-online" />
                <span className="text-green-500">
                  Connected: {viewerInfo.viewerEmail}
                </span>
              </div>
            )}
          </Card>

          {/* Preview */}
          <Card padding="sm">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="font-medium text-white flex items-center">
                <FiMonitor className="w-5 h-5 mr-2 text-primary-500" />
                Your Screen Preview
              </h3>
              <Button
                variant="ghost"
                size="sm"
                icon={FiSettings}
              >
                Settings
              </Button>
            </div>
            
            <RemoteScreen
              stream={localStream}
              showControls={true}
              className="aspect-video"
            />
          </Card>

          {/* Controls */}
          <div className="flex justify-center space-x-4">
            <Button
              variant="danger"
              size="lg"
              icon={FiX}
              onClick={handleStopSharing}
            >
              Stop Sharing
            </Button>
          </div>
        </>
      )}

      {/* Tips */}
      {step === 'setup' && (
        <Card>
          <h3 className="font-medium text-white mb-4">Tips for a good session</h3>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li className="flex items-start">
              <span className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 mr-3" />
              Use a stable internet connection for better streaming quality
            </li>
            <li className="flex items-start">
              <span className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 mr-3" />
              Close unnecessary applications to reduce CPU usage
            </li>
            <li className="flex items-start">
              <span className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 mr-3" />
              Share only the window or screen you want others to see
            </li>
            <li className="flex items-start">
              <span className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 mr-3" />
              Only share the session code with people you trust
            </li>
          </ul>
        </Card>
      )}
    </div>
  );
}

export default HostSession;
