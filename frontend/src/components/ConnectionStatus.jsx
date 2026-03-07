/**
 * Connection Status Component
 * Shows the current WebRTC connection status
 */

import { Wifi, WifiOff, Loader, Check, AlertCircle } from 'lucide-react';

function ConnectionStatus({ state, className = '' }) {
  const statusConfig = {
    disconnected: { icon: WifiOff, color: 'text-[var(--text-muted)]', bgColor: 'bg-white/5', label: 'Disconnected' },
    connecting:   { icon: Loader, color: 'text-neon-orange', bgColor: 'bg-neon-orange/10', label: 'Connecting...', animate: true },
    connected:    { icon: Check, color: 'text-neon-green', bgColor: 'bg-neon-green/10', label: 'Connected' },
    waiting:      { icon: Loader, color: 'text-accent', bgColor: 'bg-accent/10', label: 'Waiting for viewer...', animate: true },
    failed:       { icon: AlertCircle, color: 'text-neon-red', bgColor: 'bg-neon-red/10', label: 'Connection Failed' }
  };

  const config = statusConfig[state] || statusConfig.disconnected;
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center px-3 py-1.5 rounded-full ${config.bgColor} ${className}`}>
      <Icon size={14} className={`mr-1.5 ${config.color} ${config.animate ? 'animate-spin' : ''}`} />
      <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
    </div>
  );
}

export default ConnectionStatus;
