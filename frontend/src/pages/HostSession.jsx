import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Monitor, Share2, X, Copy, Check, Users, AlertCircle,
  Wifi, Eye, MousePointer, Lock, Unlock, Download, Link2,
  Shield, Play, Square, Zap, ChevronRight
} from 'lucide-react';
import { RemoteScreen, ConnectionStatus, LoadingSpinner } from '../components';
import { useWebRTC } from '../hooks/useWebRTC';
import { useSocket } from '../hooks/useSocket';
import useDeviceStore from '../store/deviceStore';
import useSessionStore from '../store/sessionStore';
import useAuthStore from '../store/authStore';

/* ─── Sub-components ─── */

function ControlModeToggle({ controlMode, onToggle, disabled }) {
  const isView = controlMode === 'view';
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
        ${isView
          ? 'bg-accent/10 text-accent border border-accent/30'
          : 'bg-neon-purple/10 text-neon-purple border border-neon-purple/30'}
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:shadow-neon cursor-pointer'}`}
    >
      {isView ? <Eye size={16} /> : <MousePointer size={16} />}
      {isView ? 'View Only' : 'Full Control'}
    </button>
  );
}

function SessionCodeDisplay({ code, onCopy, copied }) {
  if (!code) return null;
  const digits = code.split('');
  return (
    <div className="flex flex-col items-center gap-3">
      <span className="text-xs uppercase tracking-widest text-[var(--text-muted)]">Session Code</span>
      <div className="flex gap-2">
        {digits.map((d, i) => (
          <span key={i} className="session-code-digit">{d}</span>
        ))}
      </div>
      <button
        onClick={onCopy}
        className="flex items-center gap-1.5 text-sm text-accent hover:text-white transition-colors"
      >
        {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Code</>}
      </button>
    </div>
  );
}

/* ─── Main Component ─── */

export default function HostSession() {
  const { user } = useAuthStore();
  const { currentDevice, registerDevice } = useDeviceStore();
  const { createSession, currentSession, endSession } = useSessionStore();
  const { socket, connected: socketConnected } = useSocket();

  const [step, setStep] = useState('setup');
  const [isSharing, setIsSharing] = useState(false);
  const [sessionCode, setSessionCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [viewers, setViewers] = useState([]);
  const [controlMode, setControlMode] = useState('view');
  const [agentStatus, setAgentStatus] = useState('disconnected');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    localStream, remoteStream, connectionState, error: webrtcError,
    startScreenShare, stopScreenShare, sendControlEvent, getStats
  } = useWebRTC();

  const streamRef = useRef(null);

  /* ─── Register device on mount ─── */
  useEffect(() => {
    if (!currentDevice && user) {
      registerDevice({
        name: `${user.name}'s Device`,
        type: 'desktop',
        os: navigator.platform
      });
    }
  }, [currentDevice, user, registerDevice]);

  /* ─── Socket listeners ─── */
  useEffect(() => {
    if (!socket) return;

    const onAgentStatus = (data) => setAgentStatus(data.status);
    const onViewerJoined = (data) => {
      setViewers((prev) => [...prev.filter((v) => v.id !== data.viewerId), { id: data.viewerId, name: data.viewerName || 'Unknown', joinedAt: new Date() }]);
      setStep('connected');
    };
    const onViewerLeft = (data) => setViewers((prev) => prev.filter((v) => v.id !== data.viewerId));
    const onControlEvent = (data) => {
      if (controlMode === 'control') sendControlEvent(data);
    };

    socket.on('agent:status', onAgentStatus);
    socket.on('viewer-joined', onViewerJoined);
    socket.on('viewer-left', onViewerLeft);
    socket.on('control:event', onControlEvent);

    return () => {
      socket.off('agent:status', onAgentStatus);
      socket.off('viewer-joined', onViewerJoined);
      socket.off('viewer-left', onViewerLeft);
      socket.off('control:event', onControlEvent);
    };
  }, [socket, controlMode, sendControlEvent]);

  /* ─── Keep ref in sync ─── */
  useEffect(() => { streamRef.current = localStream; }, [localStream]);

  /* ─── Handlers ─── */
  const handleStartSharing = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const stream = await startScreenShare();
      if (!stream) throw new Error('Screen share was cancelled or failed');

      const session = await createSession({ type: 'screen-share', controlMode });
      if (!session?.sessionCode) throw new Error('Failed to create session');

      setSessionCode(session.sessionCode);
      setIsSharing(true);
      setStep('sharing');

      if (socket) {
        socket.emit('host-session', {
          sessionCode: session.sessionCode,
          deviceId: currentDevice?._id
        });
      }

      stream.getVideoTracks()[0]?.addEventListener('ended', () => handleStopSharing());
    } catch (err) {
      setError(err.message || 'Failed to start sharing');
      stopScreenShare();
    } finally {
      setIsLoading(false);
    }
  }, [startScreenShare, createSession, controlMode, socket, currentDevice, stopScreenShare]);

  const handleStopSharing = useCallback(async () => {
    try {
      stopScreenShare();
      if (currentSession) await endSession(currentSession._id);
      if (socket && sessionCode) socket.emit('end-session', { sessionCode });
    } catch (err) {
      console.error('Error stopping session:', err);
    } finally {
      setIsSharing(false);
      setSessionCode('');
      setViewers([]);
      setStep('setup');
      setControlMode('view');
    }
  }, [stopScreenShare, endSession, currentSession, socket, sessionCode]);

  const handleCopyCode = useCallback(() => {
    if (!sessionCode) return;
    navigator.clipboard.writeText(sessionCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [sessionCode]);

  const handleLaunchAgent = useCallback(() => {
    window.open('https://github.com/singhavanjot/Let-sClone/releases', '_blank', 'noopener');
  }, []);

  const handleControlModeChange = useCallback(() => {
    const next = controlMode === 'view' ? 'control' : 'view';
    setControlMode(next);
    if (socket && sessionCode) {
      socket.emit('control-mode-change', { sessionCode, mode: next });
    }
  }, [controlMode, socket, sessionCode]);

  /* ─── Cleanup on unmount ─── */
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  /* ─── Step: Setup ─── */
  const renderSetup = () => (
    <motion.div
      key="setup"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center gap-8 max-w-lg mx-auto text-center"
    >
      <div className="w-20 h-20 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
        <Monitor size={36} className="text-accent" />
      </div>

      <div>
        <h2 className="text-2xl font-display font-bold text-white mb-2">Share Your Screen</h2>
        <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
          Start a session to share your screen with others. You'll get a session code to send to viewers.
        </p>
      </div>

      <div className="w-full glass-card-static p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {controlMode === 'view' ? <Eye size={18} className="text-accent" /> : <MousePointer size={18} className="text-neon-purple" />}
            <div className="text-left">
              <p className="text-sm font-medium text-white">Control Mode</p>
              <p className="text-xs text-[var(--text-muted)]">
                {controlMode === 'view' ? 'Viewers can only watch' : 'Viewers can control your device'}
              </p>
            </div>
          </div>
          <ControlModeToggle controlMode={controlMode} onToggle={handleControlModeChange} />
        </div>

        <div className="border-t border-white/5" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield size={18} className="text-neon-green" />
            <div className="text-left">
              <p className="text-sm font-medium text-white">Encryption</p>
              <p className="text-xs text-[var(--text-muted)]">End-to-end encrypted via WebRTC</p>
            </div>
          </div>
          <span className="badge-success">Active</span>
        </div>
      </div>

      {agentStatus === 'disconnected' && controlMode === 'control' && (
        <div className="w-full glass-card-static p-4 border-neon-orange/20">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-neon-orange mt-0.5 shrink-0" />
            <div className="text-left">
              <p className="text-sm font-medium text-neon-orange">Desktop Agent Required</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                For remote control, install and run the desktop agent on this machine.
              </p>
              <button onClick={handleLaunchAgent} className="flex items-center gap-1.5 mt-2 text-xs text-accent hover:text-white transition-colors">
                <Download size={14} /> Download Agent
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="w-full p-3 rounded-lg bg-neon-red/10 border border-neon-red/20 text-neon-red text-sm flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <button
        onClick={handleStartSharing}
        disabled={isLoading}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <LoadingSpinner size="sm" />
        ) : (
          <>
            <Play size={18} />
            Start Sharing
          </>
        )}
      </button>
    </motion.div>
  );

  /* ─── Step: Sharing (waiting for viewer) ─── */
  const renderSharing = () => (
    <motion.div
      key="sharing"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-neon-green animate-pulse" />
          <h2 className="text-lg font-display font-bold text-white">Screen Sharing Active</h2>
        </div>
        <button onClick={handleStopSharing} className="btn-danger flex items-center gap-2 text-sm">
          <Square size={14} /> Stop Sharing
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <span className="text-sm font-medium text-white flex items-center gap-2">
                <Monitor size={16} className="text-accent" /> Live Preview
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                {localStream?.getVideoTracks()[0]?.getSettings().width}×
                {localStream?.getVideoTracks()[0]?.getSettings().height}
              </span>
            </div>
            <div className="aspect-video bg-black/40">
              {localStream ? (
                <RemoteScreen stream={localStream} muted isLocal />
              ) : (
                <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-sm">
                  No preview available
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-card-static p-5">
            <SessionCodeDisplay code={sessionCode} onCopy={handleCopyCode} copied={copied} />
          </div>

          <div className="glass-card-static p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">Control</span>
              <ControlModeToggle controlMode={controlMode} onToggle={handleControlModeChange} disabled={viewers.length > 0} />
            </div>
          </div>

          {controlMode === 'control' && (
            <div className="glass-card-static p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">Agent</span>
                <span className={`text-xs font-medium flex items-center gap-1.5
                  ${agentStatus === 'connected' ? 'text-neon-green' : 'text-neon-orange'}`}>
                  <span className={`w-2 h-2 rounded-full ${agentStatus === 'connected' ? 'bg-neon-green' : 'bg-neon-orange'}`} />
                  {agentStatus === 'connected' ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              {agentStatus !== 'connected' && (
                <button onClick={handleLaunchAgent} className="mt-3 text-xs text-accent hover:text-white transition-colors flex items-center gap-1">
                  <Download size={12} /> Download Agent
                </button>
              )}
            </div>
          )}

          <div className="glass-card-static p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[var(--text-secondary)]">Viewers</span>
              <span className="text-xs font-mono text-accent">{viewers.length}</span>
            </div>
            {viewers.length === 0 ? (
              <div className="text-center py-4">
                <Users size={20} className="mx-auto text-[var(--text-muted)] mb-2" />
                <p className="text-xs text-[var(--text-muted)]">Waiting for viewers…</p>
              </div>
            ) : (
              <div className="space-y-2">
                {viewers.map((v) => (
                  <div key={v.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                    <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-xs text-accent font-bold">
                      {(v.name || '?')[0].toUpperCase()}
                    </div>
                    <span className="text-sm text-white truncate">{v.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  /* ─── Step: Connected ─── */
  const renderConnected = () => (
    <motion.div
      key="connected"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-neon-green animate-pulse" />
          <h2 className="text-lg font-display font-bold text-white">
            Connected · {viewers.length} viewer{viewers.length !== 1 ? 's' : ''}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <ControlModeToggle controlMode={controlMode} onToggle={handleControlModeChange} />
          <button onClick={handleStopSharing} className="btn-danger flex items-center gap-2 text-sm">
            <Square size={14} /> End Session
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="glass-card overflow-hidden">
            <div className="p-3 border-b border-white/5 flex items-center justify-between">
              <span className="text-sm font-medium text-white flex items-center gap-2">
                <Monitor size={16} className="text-accent" /> Live Preview
              </span>
              <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1">
                  <Users size={12} /> {viewers.length}
                </span>
                <span className="flex items-center gap-1">
                  {controlMode === 'control' ? <Unlock size={12} className="text-neon-purple" /> : <Lock size={12} />}
                  {controlMode === 'control' ? 'Control' : 'View'}
                </span>
              </div>
            </div>
            <div className="aspect-video bg-black/40">
              {localStream ? (
                <RemoteScreen stream={localStream} muted isLocal />
              ) : (
                <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-sm">
                  No preview available
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-card-static p-4">
            <SessionCodeDisplay code={sessionCode} onCopy={handleCopyCode} copied={copied} />
          </div>

          <div className="glass-card-static p-4">
            <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <Users size={14} className="text-accent" /> Viewers
            </h3>
            <div className="space-y-2">
              {viewers.map((v) => (
                <div key={v.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-xs text-accent font-bold">
                    {(v.name || '?')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm text-white truncate block">{v.name}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {new Date(v.joinedAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {controlMode === 'control' && (
            <div className="glass-card-static p-4">
              <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                <Zap size={14} className="text-neon-purple" /> Agent
              </h3>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${agentStatus === 'connected' ? 'bg-neon-green' : 'bg-neon-orange'}`} />
                <span className={`text-xs ${agentStatus === 'connected' ? 'text-neon-green' : 'text-neon-orange'}`}>
                  {agentStatus === 'connected' ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              {agentStatus !== 'connected' && (
                <button onClick={handleLaunchAgent} className="mt-2 text-xs text-accent hover:text-white transition-colors flex items-center gap-1">
                  <Download size={12} /> Download
                </button>
              )}
            </div>
          )}

          <div className="glass-card-static p-4">
            <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
              <Wifi size={14} className="text-accent" /> Connection
            </h3>
            <ConnectionStatus state={connectionState} />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-neon-red/10 border border-neon-red/20 text-neon-red text-sm flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}
    </motion.div>
  );

  /* ─── Render ─── */
  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 md:p-6">
      <AnimatePresence mode="wait">
        {step === 'setup' && renderSetup()}
        {step === 'sharing' && renderSharing()}
        {step === 'connected' && renderConnected()}
      </AnimatePresence>
    </div>
  );
}
