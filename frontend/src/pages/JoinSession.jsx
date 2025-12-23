/**
 * Join Session Page
 * Enter a session code to join as a viewer
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLink, FiArrowRight, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';

import { Card, Button, Input, LoadingSpinner } from '../components';
import { useDeviceStore, useSessionStore } from '../store';

function JoinSession() {
  const [sessionCode, setSessionCode] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  
  const { currentDevice, getOrCreateDevice, fetchDevices } = useDeviceStore();
  const { joinSession, isLoading, activeSessions, fetchActiveSessions } = useSessionStore();

  // Load device and active sessions
  useEffect(() => {
    const loadData = async () => {
      await fetchDevices();
      await getOrCreateDevice();
      await fetchActiveSessions();
    };
    loadData();
  }, [fetchDevices, getOrCreateDevice, fetchActiveSessions]);

  // Format session code input
  const handleCodeChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length <= 6) {
      setSessionCode(value);
      setError('');
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (pasted.length <= 6) {
      setSessionCode(pasted);
      setError('');
    }
  };

  // Join session
  const handleJoin = async (e) => {
    e.preventDefault();
    
    if (sessionCode.length !== 6) {
      setError('Session code must be 6 characters');
      return;
    }

    if (!currentDevice) {
      toast.error('No device registered. Please wait...');
      return;
    }

    const result = await joinSession(sessionCode, currentDevice.deviceId);
    
    if (result.success) {
      toast.success('Joining session...');
      navigate(`/session/${sessionCode}`);
    } else {
      setError(result.error);
      toast.error(result.error);
    }
  };

  // Quick join from active session
  const handleQuickJoin = (code) => {
    setSessionCode(code);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Join Session</h1>
        <p className="text-gray-400 mt-1">
          Enter a session code to view a remote desktop
        </p>
      </div>

      {/* Join Form */}
      <Card className="py-8">
        <form onSubmit={handleJoin} className="max-w-sm mx-auto text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-2xl bg-green-500/10 mb-6">
            <FiLink className="w-8 h-8 text-green-500" />
          </div>

          <h2 className="text-lg font-medium text-white mb-6">
            Enter Session Code
          </h2>

          {/* Session code input */}
          <div className="mb-6">
            <input
              type="text"
              value={sessionCode}
              onChange={handleCodeChange}
              onPaste={handlePaste}
              placeholder="XXXXXX"
              maxLength={6}
              className={`
                w-full text-center text-3xl font-bold tracking-[0.3em]
                py-4 px-6 bg-dark-700 border rounded-xl
                text-white placeholder-gray-600
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                ${error ? 'border-red-500' : 'border-dark-600'}
              `}
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-red-500">{error}</p>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            fullWidth
            icon={FiArrowRight}
            loading={isLoading}
            disabled={sessionCode.length !== 6 || !currentDevice}
          >
            Join Session
          </Button>

          {!currentDevice && (
            <p className="text-sm text-gray-500 mt-4">
              Registering your device...
            </p>
          )}
        </form>
      </Card>

      {/* Active sessions you can rejoin */}
      {activeSessions.length > 0 && (
        <Card>
          <h3 className="font-medium text-white mb-4 flex items-center">
            <FiClock className="w-5 h-5 mr-2 text-primary-500" />
            Your Active Sessions
          </h3>
          
          <div className="space-y-2">
            {activeSessions.filter(s => !s.isHost).map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors cursor-pointer"
                onClick={() => handleQuickJoin(session.sessionCode)}
              >
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3 pulse-online" />
                  <span className="font-mono text-white">{session.sessionCode}</span>
                </div>
                <Button variant="ghost" size="sm">
                  Rejoin
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <h3 className="font-medium text-white mb-4">How to join</h3>
        <ol className="space-y-3 text-gray-400 text-sm">
          <li className="flex items-start">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-500/10 text-primary-500 text-xs font-medium mr-3 mt-0.5">
              1
            </span>
            Get a 6-character session code from the person sharing their screen
          </li>
          <li className="flex items-start">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-500/10 text-primary-500 text-xs font-medium mr-3 mt-0.5">
              2
            </span>
            Enter the code in the field above
          </li>
          <li className="flex items-start">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-500/10 text-primary-500 text-xs font-medium mr-3 mt-0.5">
              3
            </span>
            Click "Join Session" to connect to the remote desktop
          </li>
          <li className="flex items-start">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-500/10 text-primary-500 text-xs font-medium mr-3 mt-0.5">
              4
            </span>
            You can view and control the remote screen (if allowed by host)
          </li>
        </ol>
      </Card>
    </div>
  );
}

export default JoinSession;
