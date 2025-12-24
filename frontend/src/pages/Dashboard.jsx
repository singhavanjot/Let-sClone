/**
 * Dashboard Page
 * Main dashboard with overview and quick actions
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiMonitor, 
  FiLink, 
  FiActivity, 
  FiClock,
  FiPlus,
  FiArrowRight
} from 'react-icons/fi';

import { Card, Button, DeviceCard, LoadingSpinner } from '../components';
import { useAuthStore, useDeviceStore, useSessionStore } from '../store';

function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  
  const user = useAuthStore((state) => state.user);
  const { devices, fetchDevices, getOrCreateDevice } = useDeviceStore();
  const { activeSessions, sessionHistory, fetchActiveSessions, fetchSessionHistory } = useSessionStore();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchDevices(),
          fetchActiveSessions(),
          fetchSessionHistory(1, 5),
          getOrCreateDevice()
        ]);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [fetchDevices, fetchActiveSessions, fetchSessionHistory, getOrCreateDevice]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const stats = [
    {
      label: 'Registered Devices',
      value: devices.length,
      icon: FiMonitor,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      label: 'Active Sessions',
      value: activeSessions.length,
      icon: FiActivity,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      label: 'Total Sessions',
      value: sessionHistory.length,
      icon: FiClock,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          Welcome back, {user?.name || 'User'}!
        </h1>
        <p className="text-gray-400 mt-1">
          Here's an overview of your Let'sClone activity
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          hover
          className="flex items-center justify-between cursor-pointer"
          onClick={() => window.location.href = '/host'}
        >
          <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary-500/10">
              <FiMonitor className="w-6 h-6 text-primary-500" />
            </div>
            <div className="ml-4">
              <h3 className="font-medium text-white">Host a Session</h3>
              <p className="text-sm text-gray-400">Share your screen with others</p>
            </div>
          </div>
          <FiArrowRight className="w-5 h-5 text-gray-400" />
        </Card>

        <Card
          hover
          className="flex items-center justify-between cursor-pointer"
          onClick={() => window.location.href = '/join'}
        >
          <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-500/10">
              <FiLink className="w-6 h-6 text-green-500" />
            </div>
            <div className="ml-4">
              <h3 className="font-medium text-white">Join a Session</h3>
              <p className="text-sm text-gray-400">Connect to a remote screen</p>
            </div>
          </div>
          <FiArrowRight className="w-5 h-5 text-gray-400" />
        </Card>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <div className="flex items-center">
                <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-gray-400">{stat.label}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Devices Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Your Devices</h2>
          <Link to="/settings">
            <Button variant="ghost" size="sm" icon={FiPlus}>
              Add Device
            </Button>
          </Link>
        </div>

        {devices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {devices.slice(0, 6).map((device) => (
              <DeviceCard
                key={device.deviceId}
                device={device}
                showActions={false}
              />
            ))}
          </div>
        ) : (
          <Card className="text-center py-8">
            <FiMonitor className="w-12 h-12 mx-auto text-gray-500 mb-4" />
            <p className="text-gray-400">No devices registered yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Your current device will be registered when you start hosting
            </p>
          </Card>
        )}
      </div>

      {/* Recent Sessions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Recent Sessions</h2>
        </div>

        {sessionHistory.length > 0 ? (
          <Card padding="none">
            <div className="divide-y divide-dark-700">
              {sessionHistory.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 hover:bg-dark-700/50"
                >
                  <div className="flex items-center">
                    <div className={`
                      w-3 h-3 rounded-full mr-4
                      ${session.status === 'active' ? 'bg-green-500 pulse-online' : 
                        session.status === 'ended' ? 'bg-gray-500' : 'bg-yellow-500'}
                    `} />
                    <div>
                      <p className="font-medium text-white">
                        Session {session.sessionCode}
                      </p>
                      <p className="text-sm text-gray-400">
                        {session.isHost ? 'Hosted' : 'Viewed'} • 
                        {session.hostDevice || 'Unknown device'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </p>
                    {session.duration > 0 && (
                      <p className="text-xs text-gray-500">
                        Duration: {Math.floor(session.duration / 60)}m {session.duration % 60}s
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="text-center py-8">
            <FiClock className="w-12 h-12 mx-auto text-gray-500 mb-4" />
            <p className="text-gray-400">No sessions yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Start hosting or join a session to see your history
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
