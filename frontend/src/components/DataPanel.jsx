/**
 * Data Panel Component
 * Shows stats/info in hacker style
 */

import { motion } from 'framer-motion';

function DataPanel({ 
  label, 
  value, 
  icon: Icon,
  trend,
  color = 'green',
  className = '' 
}) {
  const colors = {
    green: { primary: '#00ff41', glow: 'rgba(0, 255, 65, 0.3)' },
    cyan: { primary: '#00f5ff', glow: 'rgba(0, 245, 255, 0.3)' },
    purple: { primary: '#bf00ff', glow: 'rgba(191, 0, 255, 0.3)' },
    orange: { primary: '#ff6600', glow: 'rgba(255, 102, 0, 0.3)' },
  };

  const colorConfig = colors[color] || colors.green;

  return (
    <motion.div
      className={`
        relative p-4 bg-black/50
        border overflow-hidden
        ${className}
      `}
      style={{
        borderColor: `${colorConfig.primary}50`,
        clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        boxShadow: `0 0 20px ${colorConfig.glow}`,
        borderColor: colorConfig.primary,
      }}
    >
      {/* Background glow */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          background: `radial-gradient(circle at top right, ${colorConfig.primary}, transparent 70%)`,
        }}
      />

      {/* Corner decoration */}
      <div 
        className="absolute top-0 right-0 w-8 h-8"
        style={{
          background: `linear-gradient(135deg, ${colorConfig.primary}20 50%, transparent 50%)`,
        }}
      />

      <div className="relative z-10 flex items-center gap-4">
        {/* Icon */}
        {Icon && (
          <div 
            className="p-3 border"
            style={{
              borderColor: `${colorConfig.primary}50`,
              backgroundColor: `${colorConfig.primary}10`,
              clipPath: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)',
            }}
          >
            <Icon 
              className="w-6 h-6"
              style={{ color: colorConfig.primary }}
            />
          </div>
        )}

        <div className="flex-1">
          {/* Label */}
          <p 
            className="text-xs uppercase tracking-wider mb-1 opacity-70"
            style={{ 
              fontFamily: "'Share Tech Mono', monospace",
              color: colorConfig.primary,
            }}
          >
            [{label}]
          </p>

          {/* Value */}
          <div className="flex items-center gap-2">
            <motion.p
              className="text-2xl font-bold"
              style={{
                fontFamily: "'Orbitron', sans-serif",
                color: colorConfig.primary,
                textShadow: `0 0 10px ${colorConfig.glow}`,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {value}
            </motion.p>

            {/* Trend indicator */}
            {trend && (
              <span 
                className={`text-xs ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}
                style={{ fontFamily: "'Share Tech Mono', monospace" }}
              >
                {trend > 0 ? '▲' : '▼'} {Math.abs(trend)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom data stream */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-0.5"
        style={{
          background: `linear-gradient(90deg, transparent, ${colorConfig.primary}, transparent)`,
        }}
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      />
    </motion.div>
  );
}

export default DataPanel;
