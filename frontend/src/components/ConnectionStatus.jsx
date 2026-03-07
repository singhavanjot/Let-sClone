/**
 * Connection Status Component
 * Shows the current WebRTC connection status
 */

import { FiWifi, FiWifiOff, FiLoader, FiCheck, FiAlertCircle } from 'react-icons/fi';

function ConnectionStatus({ state, className = '' }) {
  const statusConfig = {
    disconnected: {
      icon: FiWifiOff,
      color: 'text-gray-500',
      bgColor: 'bg-gray-500/10',
      label: 'Disconnected'
    },
    connecting: {
      icon: FiLoader,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      label: 'Connecting...',
      animate: true
    },
    connected: {
      icon: FiCheck,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      label: 'Connected'
    },
    waiting: {
      icon: FiLoader,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      label: 'Waiting for viewer...',
      animate: true
    },
    failed: {
      icon: FiAlertCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      label: 'Connection Failed'
    }
  };

  const config = statusConfig[state] || statusConfig.disconnected;
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center px-4 py-2 rounded-full ${config.bgColor} ${className}`}>
      <Icon className={`w-4 h-4 mr-2 ${config.color} ${config.animate ? 'animate-spin' : ''}`} />
      <span className={`text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
    </div>
  );
}

export default ConnectionStatus;
