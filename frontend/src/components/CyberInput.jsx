/**
 * Cyber Input Component
 * Terminal-style input field
 */

import { motion } from 'framer-motion';
import { useState } from 'react';

function CyberInput({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  icon: Icon,
  prefix = '>_',
  className = '',
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {label && (
        <label 
          className="block text-sm font-semibold mb-2 uppercase tracking-wider"
          style={{ 
            color: error ? '#ff0040' : '#00ff41',
            fontFamily: "'Share Tech Mono', monospace",
          }}
        >
          <span className="text-cyan-400">[</span>
          {label}
          <span className="text-cyan-400">]</span>
        </label>
      )}

      <div className="relative">
        {/* Terminal prefix */}
        <span 
          className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500 font-mono"
          style={{ fontFamily: "'Share Tech Mono', monospace" }}
        >
          {prefix}
        </span>

        {/* Input field */}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`
            w-full bg-black/80 
            py-3 pr-4 pl-12
            text-green-400
            transition-all duration-300
            ${error ? 'border-red-500' : 'border-green-500/50'}
          `}
          style={{
            border: `1px solid ${error ? '#ff0040' : isFocused ? '#00f5ff' : '#00ff4180'}`,
            boxShadow: isFocused 
              ? `0 0 15px ${error ? 'rgba(255, 0, 64, 0.3)' : 'rgba(0, 245, 255, 0.3)'}, inset 0 0 15px rgba(0, 255, 65, 0.1)`
              : 'none',
            fontFamily: "'Share Tech Mono', monospace",
            clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
          }}
          {...props}
        />

        {/* Right icon */}
        {Icon && (
          <Icon 
            className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5"
            style={{ color: isFocused ? '#00f5ff' : '#00ff41' }}
          />
        )}

        {/* Animated border */}
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-green-500 via-cyan-400 to-green-500"
          initial={{ width: '0%' }}
          animate={{ width: isFocused ? '100%' : '0%' }}
          transition={{ duration: 0.3 }}
        />

        {/* Corner decorations */}
        <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-green-500" />
        <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-green-500" />
        <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-green-500" />
        <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-green-500" />
      </div>

      {/* Error message */}
      {error && (
        <motion.p
          className="mt-2 text-sm flex items-center gap-2"
          style={{ 
            color: '#ff0040',
            fontFamily: "'Share Tech Mono', monospace",
          }}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <span className="text-red-500">[ERROR]</span> {error}
        </motion.p>
      )}
    </motion.div>
  );
}

export default CyberInput;
