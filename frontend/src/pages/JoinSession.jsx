/**
 * Join Session Page - Modern Clean Design
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiLink, 
  FiArrowRight, 
  FiClock,
  FiMonitor
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../components';
import { useDeviceStore, useSessionStore } from '../store';
import { useSocket } from '../hooks';

function JoinSession() {
  const [sessionCode, setSessionCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef([]);
  
  const navigate = useNavigate();
  const { currentDevice, getOrCreateDevice } = useDeviceStore();
  const { joinSession, activeSessions, fetchActiveSessions } = useSessionStore();
  const { isConnected: socketConnected, registerDevice } = useSocket();

  useEffect(() => {
    if (!currentDevice) {
      getOrCreateDevice();
    }
  }, [currentDevice, getOrCreateDevice]);

  // Register device via socket when connected (to set device status to online)
  useEffect(() => {
    if (socketConnected && currentDevice?.deviceId) {
      registerDevice(currentDevice.deviceId);
    }
  }, [socketConnected, currentDevice, registerDevice]);

  useEffect(() => {
    fetchActiveSessions();
  }, [fetchActiveSessions]);

  const handleInputChange = (index, value) => {
    const char = value.toUpperCase().slice(-1);
    if (!/^[A-Z0-9]$/.test(char) && char !== '') return;

    const newCode = sessionCode.split('');
    newCode[index] = char;
    const updatedCode = newCode.join('').slice(0, 6);
    setSessionCode(updatedCode);
    setError('');

    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !sessionCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter' && sessionCode.length === 6) {
      handleSubmit(e);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setSessionCode(pastedData);
    if (pastedData.length === 6) {
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (sessionCode.length !== 6) {
      setError('Please enter a valid 6-character code');
      return;
    }

    if (!currentDevice) {
      setError('Device not registered. Please wait...');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Use deviceId (the generated unique ID), not MongoDB _id
      const result = await joinSession(sessionCode, currentDevice.deviceId);
      
      if (result?.success && result?.session) {
        toast.success('Connected successfully!');
        navigate(`/session/${sessionCode}`);
      } else {
        setError(result?.error || 'Failed to join session');
        toast.error('Connection failed');
      }
    } catch (err) {
      setError(err.message || 'Failed to join session');
      toast.error('Connection failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickJoin = (code) => {
    setSessionCode(code);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-2xl font-bold text-white mb-2">Join Session</h1>
        <p className="text-gray-400">Enter the session code to connect to a remote desktop</p>
      </motion.div>

      {/* Code Input Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="glass-card p-8">
          <form onSubmit={handleSubmit}>
            <div className="text-center mb-6">
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full mb-4">
                <FiLink className="w-4 h-4 text-indigo-400" />
                <span className="text-indigo-400 text-sm font-medium">Enter Session Code</span>
              </div>
            </div>

            {/* 6-digit input */}
            <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <motion.input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength={1}
                  value={sessionCode[index] || ''}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: index * 0.05, type: 'spring' }}
                  className={`
                    w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-bold font-mono
                    bg-[#0f0f23] border-2 rounded-xl
                    text-white placeholder-gray-700
                    focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500
                    transition-all duration-200
                    ${error ? 'border-red-500' : sessionCode[index] ? 'border-indigo-500' : 'border-gray-700'}
                  `}
                  autoFocus={index === 0}
                />
              ))}
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-red-400 text-sm mb-4"
              >
                {error}
              </motion.p>
            )}

            <motion.button
              type="submit"
              disabled={isLoading || sessionCode.length !== 6 || !currentDevice}
              whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(99, 102, 241, 0.4)' }}
              whileTap={{ scale: 0.98 }}
              className="relative w-full group overflow-hidden rounded-xl py-4 px-6 font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)',
                backgroundSize: '200% 200%',
                animation: sessionCode.length === 6 && currentDevice ? 'gradient-shift 3s ease infinite' : 'none'
              }}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Connecting...</span>
                </div>
              ) : (
                <span className="flex items-center justify-center space-x-2">
                  <FiLink className="w-5 h-5" />
                  <span>Join Session</span>
                  <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </motion.button>

            {!currentDevice && (
              <p className="text-center text-gray-500 text-sm mt-4 flex items-center justify-center">
                <LoadingSpinner size="sm" />
                <span className="ml-2">Registering your device...</span>
              </p>
            )}}
          </form>
        </div>
      </motion.div>

      {/* Active Sessions */}
      <AnimatePresence>
        {activeSessions.filter(s => !s.isHost).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6"
          >
            <h3 className="font-semibold text-white mb-4 flex items-center">
              <FiClock className="w-5 h-5 mr-2 text-indigo-400" />
              Your Active Sessions
            </h3>
            
            <div className="space-y-2">
              {activeSessions.filter(s => !s.isHost).map((session) => (
                <motion.div
                  key={session.id}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => handleQuickJoin(session.sessionCode)}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="font-mono text-white tracking-wider">{session.sessionCode}</span>
                  </div>
                  <span className="text-indigo-400 text-sm font-medium">Rejoin →</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6"
      >
        <h3 className="font-semibold text-white mb-4">How to join</h3>
        <div className="space-y-3">
          {[
            'Get a 6-character session code from the person sharing their screen',
            'Enter the code in the field above',
            'Click "Join Session" to connect',
            'You can view and control the remote screen (if allowed)',
          ].map((step, i) => (
            <div key={i} className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-indigo-400 text-xs font-bold">{i + 1}</span>
              </div>
              <span className="text-gray-300 text-sm">{step}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default JoinSession;
