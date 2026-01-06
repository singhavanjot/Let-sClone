/**
 * Host Session Page - Chrome Remote Desktop Style
 */

import { useState, useEffect } from 'react';
import { 
  FiMonitor, 
  FiShare2, 
  FiX, 
  FiCopy, 
  FiCheck,
  FiUsers,
  FiAlertCircle,
  FiWifi,
  FiEye,
  FiMousePointer,
  FiDownload,
  FiLink
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { RemoteScreen, LoadingSpinner } from '../components';
import { useWebRTC, useSocket } from '../hooks';
import { useDeviceStore, useSessionStore, useAuthStore } from '../store';
import { isScreenCaptureSupported } from '../webrtc';

function HostSession() {
  const [step, setStep] = useState('setup');
  const [session, setSession] = useState(null);
  const [viewerInfo, setViewerInfo] = useState(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [controlMode, setControlMode] = useState('full-control');
  const [agentConnected, setAgentConnected] = useState(false);
  
  const { currentDevice, getOrCreateDevice, fetchDevices } = useDeviceStore();
  const { createSession, endSession, isLoading: sessionLoading } = useSessionStore();
  const { isConnected: socketConnected, registerDevice, on, off, emit } = useSocket();
  const { token } = useAuthStore();
  
  const {
    connectionState,
    localStream,
    error: webrtcError,
    startHosting,
    endConnection
  } = useWebRTC(true);

  const handleCopyCode = () => {
    if (session?.sessionCode) {
      navigator.clipboard.writeText(session.sessionCode);
      setCodeCopied(true);
      toast.success('Code copied to clipboard!');
      setTimeout(() => setCodeCopied(false), 3000);
    }
  };

  const handleLaunchAgent = () => {
    if (!session?.sessionCode || !token) {
      toast.error('Session not ready');
      return;
    }
    
    const agentUrl = `letsclone://connect?code=${session.sessionCode}&token=${encodeURIComponent(token)}`;
    window.location.href = agentUrl;
    
    setTimeout(() => {
      toast(`If agent didn'\''t open, enter code manually: ${session.sessionCode}`, { duration: 5000 });
    }, 1000);
  };

  useEffect(() => {
    const handleAgentStatus = (data) => {
      if (data.sessionCode === session?.sessionCode) {
        setAgentConnected(data.connected);
        if (data.connected) {
          toast.success('Desktop Agent connected!');
        }
      }
    };
    on('agent:status', handleAgentStatus);
    return () => off('agent:status', handleAgentStatus);
  }, [on, off, session?.sessionCode]);

  const handleControlModeChange = (mode) => {
    setControlMode(mode);
    if (session?.sessionCode) {
      emit('control-mode-change', { sessionCode: session.sessionCode, controlMode: mode });
      toast.success(mode === 'full-control' ? 'Full control enabled' : 'View only mode');
    }
  };

  useEffect(() => {
    if (!currentDevice) getOrCreateDevice();
  }, [currentDevice, getOrCreateDevice]);

  useEffect(() => {
    if (socketConnected && currentDevice) {
      registerDevice(currentDevice.deviceId);
    }
  }, [socketConnected, currentDevice, registerDevice]);

  useEffect(() => {
    const handleViewerJoined = (data) => {
      setViewerInfo(data);
      setStep('connected');
      toast.success(`${data.viewerEmail || 'Viewer'} connected!`);
    };

    const handleViewerLeft = () => {
      setViewerInfo(null);
      setStep('sharing');
      toast('Viewer disconnected', { icon: '⚠️' });
    };

    on('viewer-joined', handleViewerJoined);
    on('viewer-left', handleViewerLeft);
    return () => {
      off('viewer-joined', handleViewerJoined);
      off('viewer-left', handleViewerLeft);
    };
  }, [on, off]);

  useEffect(() => {
    if (webrtcError) {
      toast.error(webrtcError);
      handleStopSharing();
    }
  }, [webrtcError]);

  useEffect(() => {
    if (connectionState === 'connected' && step !== 'connected') {
      setStep('connected');
    }
  }, [connectionState, step]);

  const handleStartSharing = async () => {
    try {
      if (!currentDevice) {
        toast.error('Device not registered');
        return;
      }

      const result = await createSession(currentDevice.deviceId);
      
      if (!result.success || !result.session) {
        toast.error(result.error || 'Failed to create session');
        return;
      }

      const newSession = result.session;
      setSession(newSession);
      
      const hostingStarted = await startHosting(newSession.sessionCode);
      
      if (hostingStarted) {
        setStep('sharing');
        toast.success('Screen sharing started!');
        await fetchDevices();
      } else {
        setSession(null);
        await endSession(newSession.id);
      }
    } catch (error) {
      console.error('Start sharing error:', error);
      toast.error(error.message || 'Failed to start sharing');
      setStep('setup');
    }
  };

  const handleStopSharing = async () => {
    try {
      await endConnection();
      if (session) await endSession(session.id);
      setSession(null);
      setViewerInfo(null);
      setStep('setup');
      toast.success('Session ended');
    } catch (error) {
      console.error('Stop sharing error:', error);
    }
  };

  useEffect(() => {
    return () => {
      if (session) {
        endConnection();
        endSession(session.id);
      }
    };
  }, [session, endConnection, endSession]);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Remote Support</h1>
        <p className="text-[#a0a0b0]">Share your screen and get help from others</p>
      </div>

      {/* Setup Step */}
      {step === 'setup' && (
        <div className="space-y-6">
          {/* Start Sharing Card */}
          <div className="glass-card p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#4285f4]/20 flex items-center justify-center">
              <FiMonitor className="w-10 h-10 text-[#4285f4]" />
            </div>
            
            <h2 className="text-xl font-semibold text-white mb-3">Share Your Screen</h2>
            <p className="text-[#a0a0b0] mb-8 max-w-md mx-auto">
              Start a session to share your screen. You'\''ll receive a code to share with the person helping you.
            </p>

            {!isScreenCaptureSupported() && (
              <div className="flex items-center justify-center p-4 mb-6 bg-[#ea4335]/10 border border-[#ea4335]/30 rounded-lg text-[#ea4335]">
                <FiAlertCircle className="w-5 h-5 mr-2" />
                <span>Screen capture not supported in this browser</span>
              </div>
            )}

            <button
              onClick={handleStartSharing}
              disabled={sessionLoading || !currentDevice || !isScreenCaptureSupported()}
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#4285f4] hover:bg-[#1a73e8] text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {sessionLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Starting...</span>
                </>
              ) : (
                <>
                  <FiShare2 className="w-5 h-5" />
                  <span>Generate Code</span>
                </>
              )}
            </button>

            {!currentDevice && (
              <p className="text-sm text-[#6b6b7b] mt-4">
                Registering device...
              </p>
            )}
          </div>
        </div>
      )}

      {/* Sharing/Connected Step */}
      {(step === 'sharing' || step === 'connected') && session && (
        <div className="space-y-6">
          {/* Session Code Card */}
          <div className="glass-card p-8 text-center">
            <p className="text-[#a0a0b0] mb-4">Share this code with the person helping you</p>
            
            {/* Code Display */}
            <div className="flex justify-center gap-3 mb-6">
              {session.sessionCode.split('').map((char, i) => (
                <div key={i} className="session-code-digit">{char}</div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3 mb-6">
              <button
                onClick={handleCopyCode}
                className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  codeCopied 
                    ? 'bg-[#34a853]/20 text-[#34a853] border border-[#34a853]/30' 
                    : 'bg-[#4285f4]/20 text-[#4285f4] border border-[#4285f4]/30 hover:bg-[#4285f4]/30'
                }`}
              >
                {codeCopied ? <FiCheck className="w-5 h-5" /> : <FiCopy className="w-5 h-5" />}
                <span>{codeCopied ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            {/* Agent Status */}
            <div className="border-t border-[#2d2d4a] pt-6 mt-6">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 ${
                agentConnected 
                  ? 'bg-[#34a853]/20 text-[#34a853]' 
                  : 'bg-[#fbbc04]/20 text-[#fbbc04]'
              }`}>
                <span className={`w-2 h-2 rounded-full ${agentConnected ? 'bg-[#34a853]' : 'bg-[#fbbc04] animate-pulse'}`} />
                <span className="text-sm font-medium">
                  {agentConnected ? 'Desktop Agent Connected' : 'Waiting for connection...'}
                </span>
              </div>
              
              {!agentConnected && (
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <button
                    onClick={handleLaunchAgent}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium bg-[#a855f7]/20 text-[#a855f7] border border-[#a855f7]/30 hover:bg-[#a855f7]/30 transition-all"
                  >
                    <FiLink className="w-5 h-5" />
                    <span>Launch Agent</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Control Mode */}
          <div className="glass-card p-4">
            <h3 className="text-white font-medium mb-3 flex items-center gap-2">
              <FiMousePointer className="w-4 h-4 text-[#4285f4]" />
              Control Mode
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleControlModeChange('view-only')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  controlMode === 'view-only'
                    ? 'border-[#4285f4] bg-[#4285f4]/10 text-[#8ab4f8]'
                    : 'border-[#2d2d4a] bg-[#16213e] text-[#a0a0b0] hover:border-[#3d3d5a]'
                }`}
              >
                <FiEye className="w-6 h-6 mx-auto mb-2" />
                <p className="font-medium text-sm">View Only</p>
              </button>
              
              <button
                onClick={() => handleControlModeChange('full-control')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  controlMode === 'full-control'
                    ? 'border-[#a855f7] bg-[#a855f7]/10 text-[#c084fc]'
                    : 'border-[#2d2d4a] bg-[#16213e] text-[#a0a0b0] hover:border-[#3d3d5a]'
                }`}
              >
                <FiMousePointer className="w-6 h-6 mx-auto mb-2" />
                <p className="font-medium text-sm">Full Control</p>
              </button>
            </div>
          </div>

          {/* Connection Status */}
          {step === 'sharing' && (
            <div className="text-center p-4 bg-[#fbbc04]/10 rounded-lg border border-[#fbbc04]/30">
              <div className="flex items-center justify-center gap-2 text-[#fbbc04]">
                <FiWifi className="w-5 h-5 animate-pulse" />
                <span>Waiting for viewer to connect...</span>
              </div>
            </div>
          )}

          {step === 'connected' && viewerInfo && (
            <div className="text-center p-4 bg-[#34a853]/10 rounded-lg border border-[#34a853]/30">
              <div className="flex items-center justify-center gap-2 text-[#34a853]">
                <FiUsers className="w-5 h-5" />
                <span>Connected: {viewerInfo.viewerEmail || 'Viewer'}</span>
              </div>
            </div>
          )}

          {/* Screen Preview */}
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-white flex items-center gap-2">
                <FiMonitor className="w-5 h-5 text-[#4285f4]" />
                Your Screen
              </h3>
              <span className="px-3 py-1 bg-[#34a853]/20 text-[#34a853] text-sm rounded-full flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#34a853] animate-pulse" />
                Live
              </span>
            </div>
            
            <div className="rounded-lg overflow-hidden bg-black aspect-video">
              <RemoteScreen stream={localStream} showControls={true} />
            </div>
          </div>

          {/* Stop Button */}
          <div className="flex justify-center">
            <button
              onClick={handleStopSharing}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#ea4335] hover:bg-[#d33828] text-white font-medium rounded-lg transition-all"
            >
              <FiX className="w-5 h-5" />
              <span>Stop Sharing</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default HostSession;
