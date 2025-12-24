/**
 * Cyber Button Component
 * Hacker-themed animated button
 */

import { motion } from 'framer-motion';
import { useState } from 'react';

function CyberButton({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  icon: Icon,
  className = '',
  glowColor = 'green'
}) {
  const [isHovered, setIsHovered] = useState(false);

  const colors = {
    green: {
      border: '#00ff41',
      glow: 'rgba(0, 255, 65, 0.5)',
      text: '#00ff41',
    },
    cyan: {
      border: '#00f5ff',
      glow: 'rgba(0, 245, 255, 0.5)',
      text: '#00f5ff',
    },
    purple: {
      border: '#bf00ff',
      glow: 'rgba(191, 0, 255, 0.5)',
      text: '#bf00ff',
    },
    red: {
      border: '#ff0040',
      glow: 'rgba(255, 0, 64, 0.5)',
      text: '#ff0040',
    },
  };

  const color = colors[glowColor] || colors.green;

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <motion.button
      className={`
        relative overflow-hidden
        font-orbitron font-semibold uppercase tracking-wider
        border-2 transition-all duration-300
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      style={{
        borderColor: color.border,
        color: isHovered ? '#000' : color.text,
        backgroundColor: isHovered ? color.border : 'transparent',
        boxShadow: isHovered 
          ? `0 0 20px ${color.glow}, 0 0 40px ${color.glow}, 0 0 60px ${color.glow}`
          : `0 0 10px ${color.glow}`,
        clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
        fontFamily: "'Orbitron', sans-serif",
      }}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      disabled={disabled}
    >
      {/* Scan line effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, ${color.border}, transparent)`,
          opacity: 0.3,
        }}
        animate={{
          x: isHovered ? ['−100%', '200%'] : '−100%',
        }}
        transition={{
          duration: 0.6,
          ease: 'easeInOut',
        }}
      />

      {/* Corner accents */}
      <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2" style={{ borderColor: color.border }} />
      <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2" style={{ borderColor: color.border }} />
      <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2" style={{ borderColor: color.border }} />
      <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2" style={{ borderColor: color.border }} />

      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {loading ? (
          <span className="cyber-spinner w-5 h-5" />
        ) : (
          <>
            {Icon && <Icon className="w-5 h-5" />}
            {children}
          </>
        )}
      </span>

      {/* Glitch effect on hover */}
      {isHovered && (
        <motion.span
          className="absolute inset-0 flex items-center justify-center"
          style={{ color: '#000' }}
          animate={{
            x: [0, -2, 2, 0],
            opacity: [1, 0.8, 1],
          }}
          transition={{
            duration: 0.2,
            repeat: Infinity,
          }}
        >
          {children}
        </motion.span>
      )}
    </motion.button>
  );
}

export default CyberButton;
