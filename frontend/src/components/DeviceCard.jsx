/**
 * Device Card Component
 * Displays device information with status
 */

import { FiMonitor, FiSmartphone, FiTablet, FiMoreVertical, FiTrash2 } from 'react-icons/fi';
import Card from './Card';

function DeviceCard({ 
  device, 
  selected = false, 
  onSelect, 
  onDelete,
  showActions = true 
}) {
  const getDeviceIcon = (type) => {
    switch (type) {
      case 'mobile':
        return FiSmartphone;
      case 'tablet':
        return FiTablet;
      default:
        return FiMonitor;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'busy':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const Icon = getDeviceIcon(device.type);

  return (
    <Card
      hover={!!onSelect}
      className={`
        relative
        ${selected ? 'ring-2 ring-primary-500' : ''}
      `}
      onClick={() => onSelect?.(device)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <div className="relative">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-dark-700">
              <Icon className="w-6 h-6 text-gray-400" />
            </div>
            {/* Status indicator */}
            <span
              className={`
                absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-dark-800
                ${getStatusColor(device.status)}
                ${device.status === 'online' ? 'pulse-online' : ''}
              `}
            />
          </div>
          <div className="ml-4">
            <h3 className="font-medium text-white">{device.name}</h3>
            <p className="text-sm text-gray-400 capitalize">
              {device.type} • {device.status}
            </p>
          </div>
        </div>

        {showActions && onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(device);
            }}
            className="p-2 text-gray-500 hover:text-red-500 transition-colors"
            title="Delete device"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {device.lastSeen && (
        <p className="mt-3 text-xs text-gray-500">
          Last seen: {new Date(device.lastSeen).toLocaleString()}
        </p>
      )}
    </Card>
  );
}

export default DeviceCard;
