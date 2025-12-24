/**
 * Status Badge Component
 * Shows connection/status with cyber styling
 */

import { motion } from 'framer-motion';

function StatusBadge({ status = 'online', label, className = '' }) {
  const statusConfig = {
    online: {
      color: '#00ff41',
      label: label || 'ONLINE',
      pulse: true,
    },
    offline: {
      color: '#ff0040',
      label: label || 'OFFLINE',
      pulse: false,
    },
    connecting: {
      color: '#ff6600',
      label: label || 'CONNECTING',
      pulse: true,
    },
    secure: {
      color: '#00f5ff',
      label: label || 'SECURE',
      pulse: true,
    },
  };

  const config = statusConfig[status] || statusConfig.offline;

  return (
    <motion.div
      className={`
        inline-flex items-center gap-2 px-3 py-1
        border text-xs uppercase tracking-wider
        ${className}
      `}
      style={{
        borderColor: config.color,
        color: config.color,
        fontFamily: "'Share Tech Mono', monospace",
        boxShadow: `0 0 10px ${config.color}40`,
        clipPath: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)',
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      {/* Status dot */}
      <motion.span
        className="w-2 h-2 rounded-full"
        style={{
          backgroundColor: config.color,
          boxShadow: `0 0 5px ${config.color}`,
        }}
        animate={config.pulse ? {
          scale: [1, 1.3, 1],
          opacity: [1, 0.7, 1],
        } : {}}
        transition={{ duration: 1.5, repeat: Infinity }}
      />

      {/* Label */}
      <span>[{config.label}]</span>
    </motion.div>
  );
}

export default StatusBadge;
