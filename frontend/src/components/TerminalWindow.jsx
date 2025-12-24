/**
 * Terminal Window Component
 * Displays content in a terminal-like interface
 */

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

function TerminalWindow({ 
  title = 'terminal', 
  children,
  className = '',
  typingEffect = false,
  lines = [],
}) {
  const [displayedLines, setDisplayedLines] = useState([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);

  useEffect(() => {
    if (typingEffect && lines.length > 0) {
      if (currentLineIndex < lines.length) {
        const timer = setTimeout(() => {
          setDisplayedLines(prev => [...prev, lines[currentLineIndex]]);
          setCurrentLineIndex(prev => prev + 1);
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [currentLineIndex, lines, typingEffect]);

  return (
    <motion.div
      className={`terminal-window ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Terminal header */}
      <div className="terminal-header">
        <div className="flex items-center gap-2">
          <span className="terminal-dot red" />
          <span className="terminal-dot yellow" />
          <span className="terminal-dot green" />
        </div>
        <span 
          className="ml-4 text-xs uppercase tracking-wider"
          style={{ 
            color: '#00ff41',
            fontFamily: "'Share Tech Mono', monospace",
          }}
        >
          {title}@cyberdesk:~$
        </span>
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1 bg-green-500"
              animate={{ height: [5, 15, 5] }}
              transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
            />
          ))}
        </div>
      </div>

      {/* Terminal content */}
      <div 
        className="p-4 min-h-[200px]"
        style={{ fontFamily: "'Share Tech Mono', monospace" }}
      >
        {typingEffect ? (
          <div className="space-y-1">
            {displayedLines.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start gap-2"
              >
                <span className="text-cyan-400">$</span>
                <span className="text-green-400">{line}</span>
              </motion.div>
            ))}
            {currentLineIndex < lines.length && (
              <div className="flex items-center gap-2">
                <span className="text-cyan-400">$</span>
                <motion.span
                  className="w-2 h-4 bg-green-400"
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
              </div>
            )}
          </div>
        ) : (
          children
        )}
      </div>

      {/* Bottom status bar */}
      <div 
        className="px-4 py-2 border-t border-green-500/30 flex items-center justify-between text-xs"
        style={{ 
          color: '#00ff41',
          fontFamily: "'Share Tech Mono', monospace",
        }}
      >
        <span>[SECURE CONNECTION]</span>
        <span>
          <motion.span
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ●
          </motion.span>
          {' '}ENCRYPTED
        </span>
      </div>
    </motion.div>
  );
}

export default TerminalWindow;
