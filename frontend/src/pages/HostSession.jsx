/**
 * Host Session Page - Modern Clean Design
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  FiLock,
  FiUnlock
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { RemoteScreen, ConnectionStatus, LoadingSpinner } from '../components';
import { useWebRTC, useSocket } from '../hooks';
import { useDeviceStore, useSessionStore } from '../store';
import { isScreenCaptureSupported } from '../webrtc';

// Control Mode Options
const ControlModeSelector = ({ mode, onChange }) => (
  <div className="glass-card p-4 mb-6">
    <h3 className="text-white font-medium mb-3 flex items-center">
      <FiMousePointer className="w-4 h-4 mr-2 text-cyan-400" />
      Control Mode
    </h3>
    <div className="grid grid-cols-2 gap-3">
      <motion.button
        onClick={() => onChange('view-only')}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`p-4 rounded-xl border-2 transition-all ${
          mode === 'view-only'
            ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
            : 'border-gray-700 bg-[#0a0a15] text-gray-400 hover:border-gray-600'
        }`}
      >
        <FiEye className="w-6 h-6 mx-auto mb-2" />
        <p className="font-medium text-sm">View Only</p>
        <p className="text-xs opacity-70 mt-1">Viewer can only watch</p>
      </motion.button>
      
      <motion.button
        onClick={() => onChange('full-control')}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`p-4 rounded-xl border-2 transition-all ${
          mode === 'full-control'
            ? 'border-purple-500 bg-purple-500/10 text-purple-400'
            : 'border-gray-700 bg-[#0a0a15] text-gray-400 hover:border-gray-600'
        }`}
      >
        <FiMousePointer className="w-6 h-6 mx-auto mb-2" />
        <p className="font-medium text-sm">Full Control</p>
        <p className="text-xs opacity-70 mt-1">Viewer can control</p>
      </motion.button>
    </div>
  </div>
);

// Session Code Display Component
const SessionCodeDisplay = ({ code, onCopy, copied }) => (
  <div className="glass-card p-8 text-center">
    <p className="text-gray-400 mb-4">Share this code with your viewer</p>
    
    <div className="flex justify-center gap-3 mb-6">
      {code.split('').map((char, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: i * 0.1, type: 'spring' }}
          className="session-code-digit"
        >
          {char}
        </motion.div>
      ))}
    </div>

    <motion.button
      onClick={onCopy}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`inline-flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${
        copied 
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
          : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/30'
      }`}
    >
      {copied ? <FiCheck className="w-5 h-5" /> : <FiCopy className="w-5 h-5" />}
      <span>{copied ? 'Copied!' : 'Copy Code'}</span>
    </motion.button>
  </div>
);

function HostSession() {
  const [step, setStep] = useState('setup');
  const [session, setSession] = useState(null);
  const [viewerInfo, setViewerInfo] = useState(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [controlMode, setControlMode] = useState('full-control'); // 'view-only' or 'full-control'
  
  const { currentDevice, getOrCreateDevice, fetchDevices } = useDeviceStore();
  const { createSession, endSession, isLoading: sessionLoading } = useSessionStore();
  const { isConnected: socketConnected, registerDevice, on, off, emit } = useSocket();
  
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

  // Toggle control mode
  const handleControlModeChange = (mode) => {
    setControlMode(mode);
    // Notify viewer of control mode change
    if (session?.sessionCode) {
      emit('control-mode-change', { 
        sessionCode: session.sessionCode, 
        controlMode: mode 
      });
      toast.success(mode === 'full-control' ? 'Full control enabled' : 'View only mode enabled');
    }
  };

  useEffect(() => {
    if (!isScreenCaptureSupported()) {
      toast.error('Screen capture not supported in this browser');
    }
  }, []);

  useEffect(() => {
    if (!currentDevice) {
      getOrCreateDevice();
    }
  }, [currentDevice, getOrCreateDevice]);

  useEffect(() => {
    if (socketConnected && currentDevice) {
      registerDevice(currentDevice.id);
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

      const newSession = await createSession(currentDevice.id);
      
      if (!newSession) {
        toast.error('Failed to create session');
        return;
      }

      setSession(newSession);
      await startHosting(newSession.sessionCode);
      setStep('sharing');
      toast.success('Screen sharing started!');
      await fetchDevices();
    } catch (error) {
      console.error('Start sharing error:', error);
      toast.error(error.message || 'Failed to start sharing');
    }
  };

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
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Host Session</h1>
          <p className="text-gray-400 mt-1">Share your screen with remote viewers</p>
        </div>
        
        {step !== 'setup' && (
          <div className={`badge ${connectionState === 'connected' ? 'badge-success' : 'badge-warning'}`}>
            <span className="w-2 h-2 rounded-full bg-current mr-2" />
            {connectionState === 'connected' ? 'Connected' : 'Waiting...'}
          </div>
        )}
      </motion.div>

      <AnimatePresence mode="wait">
        {/* Setup Step */}
        {step === 'setup' && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="glass-card p-12 text-center">
              <motion.div 
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center mx-auto mb-6"
                animate={{ 
                  boxShadow: [
                    '0 0 20px rgba(99, 102, 241, 0.3)',
                    '0 0 40px rgba(99, 102, 241, 0.5)',
                    '0 0 20px rgba(99, 102, 241, 0.3)',
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <FiMonitor className="w-10 h-10 text-white" />
              </motion.div>
              
              <h2 className="text-xl font-bold text-white mb-2">Ready to Share Your Screen?</h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Start a session and share the code with anyone who needs to view
                or control your desktop remotely.
              </p>

              {!isScreenCaptureSupported() && (
                <div className="flex items-center justify-center p-4 mb-6 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
                  <FiAlertCircle className="w-5 h-5 mr-2" />
                  <span>Screen capture not supported in this browser</span>
                </div>
              )}

              <motion.button
                onClick={handleStartSharing}
                disabled={sessionLoading || !currentDevice || !isScreenCaptureSupported()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary inline-flex items-center space-x-2 disabled:opacity-50"
              >
                {sessionLoading ? (
                  <div className="loading-spinner w-5 h-5" />
                ) : (
                  <>
                    <FiShare2 className="w-5 h-5" />
                    <span>Start Sharing</span>
                  </>
                )}
              </motion.button>

              {!currentDevice && (
                <p className="text-sm text-gray-500 mt-4 flex items-center justify-center">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Registering your device...</span>
                </p>
              )}
            </div>

            {/* Tips */}
            <div className="glass-card p-6">
              <h3 className="font-semibold text-white mb-4">Tips for a good session</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  'Use a stable internet connection',
                  'Close unnecessary applications',
                  'Share only what you want visible',
                  'Only share code with trusted people',
                ].map((tip, i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 rounded-lg bg-white/5">
                    <div className="w-2 h-2 rounded-full bg-indigo-400" />
                    <span className="text-gray-300 text-sm">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Sharing/Connected Step */}
        {(step === 'sharing' || step === 'connected') && session && (
          <motion.div
            key="sharing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <SessionCodeDisplay 
              code={session.sessionCode}
              onCopy={handleCopyCode}
              copied={codeCopied}
            />

            {/* Control Mode Selector */}
            <ControlModeSelector mode={controlMode} onChange={handleControlModeChange} />

            {/* Connection Status */}
            <div className="text-center">
              {step === 'sharing' && (
                <div className="inline-flex items-center space-x-2 text-amber-400">
                  <FiWifi className="w-5 h-5 animate-pulse" />
                  <span>Waiting for viewer to connect...</span>
                </div>
              )}

              {step === 'connected' && viewerInfo && (
                <div className="flex flex-col items-center gap-3">
                  <div className="inline-flex items-center space-x-3 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span>Connected: {viewerInfo.viewerEmail}</span>
                  </div>
                  <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm ${
                    controlMode === 'full-control' 
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                      : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  }`}>
                    {controlMode === 'full-control' ? (
                      <>
                        <FiUnlock className="w-4 h-4" />
                        <span>Full Control Enabled</span>
                      </>
                    ) : (
                      <>
                        <FiLock className="w-4 h-4" />
                        <span>View Only Mode</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Screen Preview */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-white flex items-center">
                  <FiMonitor className="w-5 h-5 mr-2 text-indigo-400" />
                  Your Screen Preview
                </h3>
                <div className="badge badge-info">
                  <span className="w-2 h-2 rounded-full bg-current mr-2 animate-pulse" />
                  Live
                </div>
              </div>
              
              <div className="screen-preview aspect-video">
                <RemoteScreen
                  stream={localStream}
                  showControls={true}
                />
              </div>
            </div>

            {/* Stop Button */}
            <div className="flex justify-center">
              <motion.button
                onClick={handleStopSharing}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-danger inline-flex items-center space-x-2"
              >
                <FiX className="w-5 h-5" />
                <span>Stop Sharing</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default HostSession;
