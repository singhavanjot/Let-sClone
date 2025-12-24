/**
 * Cyber Loader Component
 * Hacker-style loading animation
 */

import { motion } from 'framer-motion';

function CyberLoader({ size = 'md', text = 'LOADING' }) {
  const sizes = {
    sm: { container: 'w-16 h-16', text: 'text-xs' },
    md: { container: 'w-24 h-24', text: 'text-sm' },
    lg: { container: 'w-32 h-32', text: 'text-base' },
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Hexagon loader */}
      <div className={`relative ${sizes[size].container}`}>
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 border-2 border-green-500/30"
          style={{
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />

        {/* Inner spinning hexagon */}
        <motion.div
          className="absolute inset-2 bg-green-500/10"
          style={{
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            boxShadow: '0 0 20px rgba(0, 255, 65, 0.3)',
          }}
          animate={{ rotate: -360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />

        {/* Pulsing center */}
        <motion.div
          className="absolute inset-4 bg-green-500/20"
          style={{
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
          }}
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />

        {/* Center dot */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
        >
          <motion.div
            className="w-3 h-3 bg-green-400 rounded-full"
            style={{ boxShadow: '0 0 10px #00ff41, 0 0 20px #00ff41' }}
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </motion.div>

        {/* Orbiting dots */}
        {[0, 60, 120, 180, 240, 300].map((angle, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-cyan-400 rounded-full"
            style={{
              top: '50%',
              left: '50%',
              boxShadow: '0 0 5px #00f5ff',
            }}
            animate={{
              x: Math.cos((angle + i * 60) * Math.PI / 180) * 40 - 4,
              y: Math.sin((angle + i * 60) * Math.PI / 180) * 40 - 4,
              rotate: 360,
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
              delay: i * 0.2,
            }}
          />
        ))}
      </div>

      {/* Loading text */}
      <motion.div 
        className={`${sizes[size].text} font-mono uppercase tracking-widest`}
        style={{ 
          color: '#00ff41',
          fontFamily: "'Share Tech Mono', monospace",
          textShadow: '0 0 10px rgba(0, 255, 65, 0.5)',
        }}
      >
        <motion.span
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {'['}
        </motion.span>
        {text.split('').map((char, i) => (
          <motion.span
            key={i}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
          >
            {char}
          </motion.span>
        ))}
        <motion.span
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {']'}
        </motion.span>
      </motion.div>

      {/* Progress bar */}
      <div className="w-48 h-1 bg-black border border-green-500/30 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-green-500 via-cyan-400 to-green-500"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    </div>
  );
}

export default CyberLoader;
