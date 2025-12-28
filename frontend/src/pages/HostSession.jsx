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
  FiUnlock,
  FiDownload,
  FiLink
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { RemoteScreen, ConnectionStatus, LoadingSpinner } from '../components';
import { useWebRTC, useSocket } from '../hooks';
import { useDeviceStore, useSessionStore, useAuthStore } from '../store';
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
const SessionCodeDisplay = ({ code, onCopy, copied, onLaunchAgent, agentConnected }) => (
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

    <div className="flex flex-col sm:flex-row justify-center gap-3 mb-6">
      <motion.button
        onClick={onCopy}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${
          copied 
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
            : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/30'
        }`}
      >
        {copied ? <FiCheck className="w-5 h-5" /> : <FiCopy className="w-5 h-5" />}
        <span>{copied ? 'Copied!' : 'Copy Code'}</span>
      </motion.button>
    </div>

    {/* Desktop Agent Section */}
    <div className="border-t border-gray-700 pt-6 mt-6">
      <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full mb-4 ${
        agentConnected 
          ? 'bg-emerald-500/20 text-emerald-400' 
          : 'bg-orange-500/20 text-orange-400'
      }`}>
        <div className={`w-2 h-2 rounded-full ${agentConnected ? 'bg-emerald-400' : 'bg-orange-400 animate-pulse'}`} />
        <span className="text-sm font-medium">
          {agentConnected ? 'Desktop Agent Connected' : 'Desktop Agent Required'}
        </span>
      </div>
      
      {!agentConnected && (
        <div className="space-y-3">
          <p className="text-gray-500 text-sm">
            Enable mouse & keyboard control by connecting the Desktop Agent
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <motion.button
              onClick={onLaunchAgent}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30 transition-all"
            >
              <FiLink className="w-5 h-5" />
              <span>Launch Agent</span>
            </motion.button>
            
            <motion.a
              href="https://github.com/user/letsclone/releases/latest/download/LetsCloneAgent-Setup.exe"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 transition-all"
              onClick={(e) => {
                e.preventDefault();
                toast((t) => (
                  <div className="text-sm">
                    <p className="font-medium mb-2">📥 Download Desktop Agent</p>
                    <p className="text-gray-300 mb-2">The agent is in the <code>desktop-agent</code> folder.</p>
                    <p className="text-gray-400 text-xs">Run: <code>npm start</code> or use built .exe</p>
                  </div>
                ), { duration: 5000 });
              }}
            >
              <FiDownload className="w-5 h-5" />
              <span>Download Agent</span>
            </motion.a>
          </div>
        </div>
      )}
    </div>
  </div>
);

function HostSession() {
  const [step, setStep] = useState('setup');
  const [session, setSession] = useState(null);
  const [viewerInfo, setViewerInfo] = useState(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [controlMode, setControlMode] = useState('full-control'); // 'view-only' or 'full-control'
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

  // Launch desktop agent with auto-connect
  const handleLaunchAgent = () => {
    if (!session?.sessionCode || !token) {
      toast.error('Session not ready');
      return;
    }
    
    // Try custom protocol first
    const agentUrl = `letsclone://connect?code=${session.sessionCode}&token=${encodeURIComponent(token)}`;
    
    // Fallback message
    const fallbackMessage = `If the agent doesn't open, please:\n1. Download and install the Desktop Agent\n2. Open it manually\n3. Enter code: ${session.sessionCode}`;
    
    // Attempt to open custom protocol
    window.location.href = agentUrl;
    
    // Show instructions after a delay (in case protocol fails)
    setTimeout(() => {
      toast((t) => (
        <div className="text-sm">
          <p className="font-medium mb-2">Agent Launch Attempted</p>
          <p className="text-gray-300">If it didn't open, enter this code manually:</p>
          <p className="font-mono text-cyan-400 text-lg mt-1">{session.sessionCode}</p>
        </div>
      ), { duration: 5000 });
    }, 1000);
  };

  // Listen for agent connection status
  useEffect(() => {
    const handleAgentStatus = (data) => {
      if (data.sessionCode === session?.sessionCode) {
        setAgentConnected(data.connected);
        if (data.connected) {
          toast.success('Desktop Agent connected! Full control enabled.');
        }
      }
    };

    on('agent:status', handleAgentStatus);
    return () => off('agent:status', handleAgentStatus);
  }, [on, off, session?.sessionCode]);

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
      // Use deviceId (the generated unique ID), not MongoDB _id
      registerDevice(currentDevice.deviceId);
    }
  }, [socketConnected, currentDevice, registerDevice]);

  // Listen for control events from viewer (for display/notification purposes)
  // Note: Actual OS-level control requires a native desktop agent
  useEffect(() => {
    const handleControlEvent = (data) => {
      const { event } = data;
      console.log('Control event received from viewer:', event);
      
      // Show visual feedback for control events (cursor position indicator could be shown)
      // In a real implementation, this would be handled by a native desktop agent
      if (event.type === 'click' || event.type === 'dblclick') {
        // Visual feedback only - actual control requires native agent
        toast(`Viewer ${event.type === 'dblclick' ? 'double-' : ''}clicked at (${event.x}, ${event.y})`, {
          icon: '🖱️',
          duration: 1000
        });
      }
    };

    on('control:event', handleControlEvent);
    return () => off('control:event', handleControlEvent);
  }, [on, off]);

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

      // Create session - use deviceId (not MongoDB _id)
      // Backend expects deviceId field which is the generated unique ID
      const result = await createSession(currentDevice.deviceId);
      
      if (!result.success || !result.session) {
        toast.error(result.error || 'Failed to create session');
        return;
      }

      const newSession = result.session;
      setSession(newSession);
      
      // Start WebRTC hosting with session code
      const hostingStarted = await startHosting(newSession.sessionCode);
      
      if (hostingStarted) {
        setStep('sharing');
        toast.success('Screen sharing started!');
        await fetchDevices();
      } else {
        // If screen sharing was cancelled or failed
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
            {/* Main Start Sharing Card */}
            <div className="glass-card overflow-hidden">
              {/* Animated background gradient */}
              <div className="relative p-12 text-center">
                {/* Background glow effects */}
                <motion.div 
                  className="absolute inset-0 opacity-30"
                  style={{
                    background: 'radial-gradient(circle at 50% 30%, rgba(99, 102, 241, 0.4) 0%, transparent 50%)'
                  }}
                  animate={{
                    opacity: [0.2, 0.4, 0.2],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                
                {/* Floating particles */}
                <div className="absolute inset-0 overflow-hidden">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 rounded-full bg-indigo-400/40"
                      style={{
                        left: `${20 + i * 15}%`,
                        top: `${30 + (i % 3) * 20}%`,
                      }}
                      animate={{
                        y: [-10, 10, -10],
                        opacity: [0.3, 0.7, 0.3],
                      }}
                      transition={{
                        duration: 2 + i * 0.5,
                        repeat: Infinity,
                        delay: i * 0.3,
                      }}
                    />
                  ))}
                </div>

                {/* Main icon with animated ring */}
                <div className="relative inline-block mb-8">
                  {/* Outer pulsing ring */}
                  <motion.div
                    className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-indigo-500/20 to-cyan-400/20"
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.5, 0.2, 0.5],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  
                  {/* Icon container */}
                  <motion.div 
                    className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 flex items-center justify-center"
                    animate={{ 
                      boxShadow: [
                        '0 0 30px rgba(99, 102, 241, 0.4)',
                        '0 0 50px rgba(99, 102, 241, 0.6)',
                        '0 0 30px rgba(99, 102, 241, 0.4)',
                      ],
                      rotateY: [0, 5, 0, -5, 0],
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <FiMonitor className="w-12 h-12 text-white" />
                    
                    {/* Screen shine effect */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/0 via-white/20 to-white/0"
                      animate={{
                        opacity: [0, 0.5, 0],
                        x: [-40, 40],
                      }}
                      transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                    />
                  </motion.div>
                </div>
              
                <h2 className="text-2xl font-bold text-white mb-3">Ready to Share Your Screen?</h2>
                <p className="text-gray-400 mb-10 max-w-md mx-auto leading-relaxed">
                  Start a secure session and share the code with anyone who needs to view
                  or control your desktop remotely.
                </p>

                {!isScreenCaptureSupported() && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center p-4 mb-8 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400"
                  >
                    <FiAlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    <span>Screen capture not supported in this browser</span>
                  </motion.div>
                )}

                {/* Enhanced Start Sharing Button */}
                <motion.button
                  onClick={handleStartSharing}
                  disabled={sessionLoading || !currentDevice || !isScreenCaptureSupported()}
                  className="group relative inline-flex items-center justify-center px-8 py-4 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 text-white font-semibold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.03, boxShadow: '0 20px 40px rgba(99, 102, 241, 0.3)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Button shine effect */}
                  <motion.span
                    className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.6 }}
                  />
                  
                  {sessionLoading ? (
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Starting Session...</span>
                    </div>
                  ) : (
                    <span className="flex items-center space-x-3">
                      <FiShare2 className="w-6 h-6" />
                      <span>Start Sharing</span>
                      <motion.span
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        →
                      </motion.span>
                    </span>
                  )}
                </motion.button>

                {!currentDevice && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-gray-500 mt-6 flex items-center justify-center"
                  >
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Registering your device...</span>
                  </motion.p>
                )}
              </div>
            </div>

            {/* Tips Section */}
            <div className="glass-card p-6">
              <h3 className="font-semibold text-white mb-5 flex items-center">
                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mr-3">
                  💡
                </span>
                Tips for a great session
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { icon: '🌐', tip: 'Use a stable internet connection' },
                  { icon: '🧹', tip: 'Close unnecessary applications' },
                  { icon: '👁️', tip: 'Share only what you want visible' },
                  { icon: '🔒', tip: 'Only share code with trusted people' },
                ].map((item, i) => (
                  <motion.div 
                    key={i} 
                    className="flex items-center space-x-3 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-gray-300 text-sm">{item.tip}</span>
                  </motion.div>
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
              onLaunchAgent={handleLaunchAgent}
              agentConnected={agentConnected}
            />

            {/* Control Mode Selector */}
            <ControlModeSelector mode={controlMode} onChange={handleControlModeChange} />

            {/* Control Info Card */}
            {controlMode === 'full-control' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-4 border border-amber-500/20 bg-amber-500/5"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <FiAlertCircle className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-amber-400 font-medium mb-1">Remote Control Active</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      Viewer can send control commands. You'll see notifications when they click or interact.
                      For full OS-level control, a native desktop agent is required.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

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
