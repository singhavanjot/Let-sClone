/**
 * Glitch Text Component
 * Animated glitch effect for headings
 */

import { motion } from 'framer-motion';

function GlitchText({ children, className = '', as = 'h1' }) {
  const Tag = as;
  
  return (
    <motion.div
      className={`relative inline-block ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Tag
        className="glitch neon-text font-orbitron"
        data-text={children}
        style={{
          fontFamily: "'Orbitron', sans-serif",
        }}
      >
        {children}
      </Tag>
      
      {/* Glitch layers */}
      <Tag
        className="absolute top-0 left-0 text-cyan-400 opacity-80"
        style={{
          fontFamily: "'Orbitron', sans-serif",
          clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 45%)',
          transform: 'translate(-2px, -2px)',
          animation: 'glitchTop 2s infinite',
        }}
        aria-hidden="true"
      >
        {children}
      </Tag>
      
      <Tag
        className="absolute top-0 left-0 text-red-500 opacity-80"
        style={{
          fontFamily: "'Orbitron', sans-serif",
          clipPath: 'polygon(0 60%, 100% 60%, 100% 100%, 0 100%)',
          transform: 'translate(2px, 2px)',
          animation: 'glitchBottom 2.5s infinite',
        }}
        aria-hidden="true"
      >
        {children}
      </Tag>
    </motion.div>
  );
}

export default GlitchText;
