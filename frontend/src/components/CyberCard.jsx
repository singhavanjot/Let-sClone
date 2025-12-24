/**
 * Cyber Card Component
 * Hacker-themed card with animations
 */

import { motion } from 'framer-motion';
import { useState } from 'react';

function CyberCard({ 
  children, 
  className = '', 
  hover = false,
  glow = true,
  padding = 'md',
  onClick,
  header,
  headerIcon: HeaderIcon,
}) {
  const [isHovered, setIsHovered] = useState(false);

  const paddings = {
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-8',
    none: 'p-0',
  };

  return (
    <motion.div
      className={`
        relative overflow-hidden
        ${paddings[padding]}
        ${hover ? 'cursor-pointer' : ''}
        ${className}
      `}
      style={{
        background: 'linear-gradient(135deg, rgba(0, 255, 65, 0.03) 0%, rgba(0, 0, 0, 0.9) 100%)',
        border: `1px solid ${isHovered ? '#00f5ff' : 'rgba(0, 255, 65, 0.3)'}`,
        boxShadow: glow && isHovered 
          ? '0 0 30px rgba(0, 255, 65, 0.2), inset 0 0 30px rgba(0, 255, 65, 0.05)'
          : '0 0 10px rgba(0, 255, 65, 0.1)',
        clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={hover ? { scale: 1.02, y: -5 } : {}}
    >
      {/* Scanning line effect */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{
          background: 'linear-gradient(90deg, transparent, #00ff41, #00f5ff, #00ff41, transparent)',
        }}
        animate={{
          x: ['-100%', '200%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Corner decorations */}
      <span className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-green-500" />
      <span className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-green-500" />
      <span className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-green-500" />
      <span className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-green-500" />

      {/* Hex pattern overlay */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none hex-grid"
      />

      {/* Header */}
      {header && (
        <div 
          className="flex items-center gap-3 mb-4 pb-3 border-b border-green-500/30"
        >
          {HeaderIcon && (
            <div 
              className="p-2 bg-green-500/10 border border-green-500/30"
              style={{ clipPath: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)' }}
            >
              <HeaderIcon className="w-5 h-5 text-green-400" />
            </div>
          )}
          <h3 
            className="text-lg font-semibold uppercase tracking-wider"
            style={{ 
              color: '#00ff41',
              fontFamily: "'Orbitron', sans-serif",
              textShadow: '0 0 10px rgba(0, 255, 65, 0.5)',
            }}
          >
            {header}
          </h3>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Glow effect on hover */}
      {hover && isHovered && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at center, rgba(0, 255, 65, 0.1) 0%, transparent 70%)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}

      {/* Data stream decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 data-stream" />
    </motion.div>
  );
}

export default CyberCard;
