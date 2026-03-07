import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, ArrowRight, Clock, Monitor, AlertCircle } from 'lucide-react';
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

  useEffect(() => { if (!currentDevice) getOrCreateDevice(); }, [currentDevice, getOrCreateDevice]);

  useEffect(() => {
    if (socketConnected && currentDevice?.deviceId) registerDevice(currentDevice.deviceId);
  }, [socketConnected, currentDevice, registerDevice]);

  useEffect(() => { fetchActiveSessions(); }, [fetchActiveSessions]);

  const handleInputChange = (index, value) => {
    const char = value.toUpperCase().slice(-1);
    if (!/^[A-Z0-9]$/.test(char) && char !== '') return;
    const newCode = sessionCode.split('');
    newCode[index] = char;
    setSessionCode(newCode.join('').slice(0, 6));
    setError('');
    if (char && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !sessionCode[index] && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'Enter' && sessionCode.length === 6) handleSubmit(e);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setSessionCode(pastedData);
    if (pastedData.length === 6) inputRefs.current[5]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sessionCode.length !== 6) { setError('Please enter a valid 6-character code'); return; }
    if (!currentDevice) { setError('Device not registered. Please wait...'); return; }

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

  const handleQuickJoin = (code) => setSessionCode(code);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-neon-purple/10 border border-neon-purple/20 flex items-center justify-center mx-auto mb-4">
            <Link2 size={28} className="text-neon-purple" />
          </div>
          <h1 className="text-2xl font-display font-bold text-white mb-1">Join Session</h1>
          <p className="text-[var(--text-secondary)] text-sm">Enter the session code to connect</p>
        </motion.div>

        {/* Code Input */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="glass-card-static p-6">
            <form onSubmit={handleSubmit}>
              <span className="block text-xs uppercase tracking-widest text-[var(--text-muted)] text-center mb-4">Session Code</span>

              <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <motion.input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    maxLength={1}
                    value={sessionCode[index] || ''}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.04, type: 'spring' }}
                    className={`session-code-digit w-11 h-13 md:w-13 md:h-15 !text-xl
                      ${error ? '!border-neon-red' : sessionCode[index] ? '!border-accent' : ''}`}
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-center text-neon-red text-sm mb-4 flex items-center justify-center gap-1.5">
                  <AlertCircle size={14} /> {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={isLoading || sessionCode.length !== 6 || !currentDevice}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <><LoadingSpinner size="sm" /> Connecting…</>
                ) : (
                  <><Link2 size={18} /> Join Session <ArrowRight size={16} /></>
                )}
              </button>

              {!currentDevice && (
                <p className="text-center text-[var(--text-muted)] text-xs mt-3 flex items-center justify-center gap-1.5">
                  <LoadingSpinner size="sm" /> Registering device…
                </p>
              )}
            </form>
          </div>
        </motion.div>

        {/* Active Sessions */}
        <AnimatePresence>
          {activeSessions.filter(s => !s.isHost).length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="glass-card-static p-5">
              <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                <Clock size={14} className="text-accent" /> Active Sessions
              </h3>
              <div className="space-y-2">
                {activeSessions.filter(s => !s.isHost).map((session) => (
                  <button key={session.id} onClick={() => handleQuickJoin(session.sessionCode)}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
                      <span className="font-mono text-white tracking-wider text-sm">{session.sessionCode}</span>
                    </div>
                    <span className="text-accent text-xs font-medium flex items-center gap-1">
                      Rejoin <ArrowRight size={12} />
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Instructions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass-card-static p-5">
          <h3 className="text-sm font-medium text-white mb-3">How to join</h3>
          <div className="space-y-2.5">
            {[
              'Get the 6-character code from the host',
              'Enter the code above',
              'Click "Join Session" to connect',
              'View or control the remote screen',
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-accent text-[10px] font-bold">{i + 1}</span>
                </div>
                <span className="text-[var(--text-secondary)] text-sm">{text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default JoinSession;
