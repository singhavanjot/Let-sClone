/**
 * Dashboard - Chrome Remote Desktop / AnyDesk Style
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FiMonitor, 
  FiLink, 
  FiCopy,
  FiCheck,
  FiArrowRight,
  FiWifi,
  FiClock,
  FiUsers
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuthStore, useDeviceStore, useSessionStore } from '../store';
import { useSocket } from '../hooks';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentDevice, getOrCreateDevice } = useDeviceStore();
  const { createSession, isLoading } = useSessionStore();
  const { isConnected: socketConnected, registerDevice } = useSocket();
  
  const [deviceId, setDeviceId] = useState('');
  const [copied, setCopied] = useState(false);
  const [connectCode, setConnectCode] = useState('');

  useEffect(() => {
    if (!currentDevice) {
      getOrCreateDevice();
    } else {
      // Generate a readable device ID from the device ID
      const shortId = currentDevice.deviceId?.slice(-9).toUpperCase() || 'XXXXXXXX';
      setDeviceId(shortId);
    }
  }, [currentDevice, getOrCreateDevice]);

  useEffect(() => {
    if (socketConnected && currentDevice?.deviceId) {
      registerDevice(currentDevice.deviceId);
    }
  }, [socketConnected, currentDevice, registerDevice]);

  const handleCopyId = () => {
    navigator.clipboard.writeText(deviceId);
    setCopied(true);
    toast.success('Device ID copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    if (connectCode.length === 6) {
      navigate(`/join?code=${connectCode}`);
    }
  };

  const handleHostSession = () => {
    navigate('/host');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">
          Welcome back, {user?.name || user?.username || 'User'}
        </h1>
        <p className="text-[#a0a0b0]">
          Connect to remote computers or allow others to connect to yours
        </p>
      </div>

      {/* Main Connection Panel - AnyDesk Style */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* This Device Section */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-[#4285f4]/20 flex items-center justify-center">
              <FiMonitor className="w-5 h-5 text-[#4285f4]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">This Device</h2>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#34a853]"></span>
                <span className="text-xs text-[#34a853]">Ready to connect</span>
              </div>
            </div>
          </div>

          {/* Device ID Display */}
          <div className="text-center py-6 px-4 bg-[#16213e] rounded-xl mb-4">
            <p className="text-xs text-[#6b6b7b] uppercase tracking-wider mb-2">Your ID</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-bold font-mono text-white tracking-wider">
                {deviceId || '--- --- ---'}
              </span>
              <button
                onClick={handleCopyId}
                className="p-2 rounded-lg hover:bg-[#2a2a4a] transition-colors"
              >
                {copied ? (
                  <FiCheck className="w-5 h-5 text-[#34a853]" />
                ) : (
                  <FiCopy className="w-5 h-5 text-[#a0a0b0]" />
                )}
              </button>
            </div>
          </div>

          {/* Allow Remote Access Button */}
          <button
            onClick={handleHostSession}
            className="w-full py-3 px-4 bg-[#4285f4] hover:bg-[#1a73e8] text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <FiWifi className="w-5 h-5" />
            Allow Remote Access
          </button>
        </div>

        {/* Connect to Remote Section */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-[#34a853]/20 flex items-center justify-center">
              <FiLink className="w-5 h-5 text-[#34a853]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Remote Desktop</h2>
              <p className="text-xs text-[#6b6b7b]">Connect to another device</p>
            </div>
          </div>

          {/* Connect Code Input */}
          <form onSubmit={handleConnect}>
            <div className="mb-4">
              <label className="block text-sm text-[#a0a0b0] mb-2">
                Enter Remote ID
              </label>
              <input
                type="text"
                value={connectCode}
                onChange={(e) => setConnectCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                placeholder="XXXXXX"
                className="w-full py-3 px-4 bg-[#16213e] border border-[#2d2d4a] rounded-lg text-white text-center text-xl font-mono tracking-wider placeholder-[#6b6b7b] focus:border-[#34a853] focus:outline-none"
                maxLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={connectCode.length !== 6}
              className="w-full py-3 px-4 bg-[#34a853] hover:bg-[#2d9348] disabled:bg-[#2a2a4a] disabled:text-[#6b6b7b] text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <FiArrowRight className="w-5 h-5" />
              Connect
            </button>
          </form>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link to="/host" className="quick-action-card">
          <div className="quick-action-icon blue">
            <FiMonitor />
          </div>
          <h3 className="text-white font-semibold mb-1">Host Session</h3>
          <p className="text-[#6b6b7b] text-sm text-center">Share your screen with others</p>
        </Link>

        <Link to="/join" className="quick-action-card">
          <div className="quick-action-icon green">
            <FiLink />
          </div>
          <h3 className="text-white font-semibold mb-1">Join Session</h3>
          <p className="text-[#6b6b7b] text-sm text-center">Connect to a remote desktop</p>
        </Link>

        <Link to="/settings" className="quick-action-card">
          <div className="w-14 h-14 rounded-xl bg-[#a855f7]/15 flex items-center justify-center mb-4">
            <FiUsers className="w-6 h-6 text-[#a855f7]" />
          </div>
          <h3 className="text-white font-semibold mb-1">Recent Sessions</h3>
          <p className="text-[#6b6b7b] text-sm text-center">View connection history</p>
        </Link>
      </div>

      {/* Connection Status */}
      <div className="mt-8 p-4 bg-[#1f1f3a] rounded-lg border border-[#2d2d4a]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${socketConnected ? 'bg-[#34a853]' : 'bg-[#fbbc04]'}`}></div>
            <span className="text-sm text-[#a0a0b0]">
              {socketConnected ? 'Connected to server' : 'Connecting to server...'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[#6b6b7b] text-sm">
            <FiClock className="w-4 h-4" />
            <span>Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}
