/**
 * Join Session Page - Chrome Remote Desktop Style
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  FiLink, 
  FiArrowRight, 
  FiMonitor,
  FiAlertCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useDeviceStore, useSessionStore } from '../store';
import { useSocket } from '../hooks';

function JoinSession() {
  const [sessionCode, setSessionCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef([]);
  const [searchParams] = useSearchParams();
  
  const navigate = useNavigate();
  const { currentDevice, getOrCreateDevice } = useDeviceStore();
  const { joinSession } = useSessionStore();
  const { isConnected: socketConnected, registerDevice } = useSocket();

  // Check for code in URL params
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl && codeFromUrl.length === 6) {
      setSessionCode(codeFromUrl.toUpperCase());
    }
  }, [searchParams]);

  useEffect(() => {
    if (!currentDevice) {
      getOrCreateDevice();
    }
  }, [currentDevice, getOrCreateDevice]);

  useEffect(() => {
    if (socketConnected && currentDevice?.deviceId) {
      registerDevice(currentDevice.deviceId);
    }
  }, [socketConnected, currentDevice, registerDevice]);

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

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Remote Access</h1>
        <p className="text-[#a0a0b0]">Enter the code to connect to a remote desktop</p>
      </div>

      {/* Code Input Card */}
      <div className="glass-card p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-[#34a853]/20 flex items-center justify-center">
            <FiLink className="w-8 h-8 text-[#34a853]" />
          </div>
          <p className="text-[#a0a0b0] text-sm">Enter the 6-digit session code</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 6-digit input */}
          <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength={1}
                value={sessionCode[index] || ''}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`code-digit ${sessionCode[index] ? 'filled' : ''} ${error ? 'border-[#ea4335]' : ''}`}
                autoFocus={index === 0}
              />
            ))}
          </div>

          {error && (
            <div className="flex items-center justify-center gap-2 text-[#ea4335] text-sm mb-4">
              <FiAlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || sessionCode.length !== 6 || !currentDevice}
            className="w-full py-4 px-6 bg-[#34a853] hover:bg-[#2d9348] disabled:bg-[#2a2a4a] disabled:text-[#6b6b7b] text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <span>Connect</span>
                <FiArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Connection Status */}
        <div className="mt-6 pt-6 border-t border-[#2d2d4a]">
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-[#34a853]' : 'bg-[#fbbc04]'}`} />
            <span className="text-[#6b6b7b]">
              {socketConnected ? 'Ready to connect' : 'Connecting to server...'}
            </span>
          </div>
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-6 text-center">
        <p className="text-[#6b6b7b] text-sm">
          Ask the person sharing their screen for the 6-digit code
        </p>
      </div>

      {/* Info Card */}
      <div className="mt-8 glass-card p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#4285f4]/20 flex items-center justify-center flex-shrink-0">
            <FiMonitor className="w-6 h-6 text-[#4285f4]" />
          </div>
          <div>
            <h3 className="text-white font-medium mb-1">How it works</h3>
            <p className="text-[#6b6b7b] text-sm leading-relaxed">
              Once connected, you'\''ll be able to see the remote screen and, if allowed, control it with your mouse and keyboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JoinSession;
