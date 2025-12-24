/**
 * Typing Text Effect
 * Animated typewriter effect
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

function TypingText({ 
  text, 
  speed = 50, 
  className = '',
  cursor = true,
  onComplete,
  delay = 0,
}) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const startTimer = setTimeout(() => {
      setStarted(true);
    }, delay);
    return () => clearTimeout(startTimer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;

    if (displayedText.length < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(text.slice(0, displayedText.length + 1));
      }, speed);
      return () => clearTimeout(timer);
    } else {
      setIsComplete(true);
      onComplete?.();
    }
  }, [displayedText, text, speed, started, onComplete]);

  return (
    <span 
      className={className}
      style={{ fontFamily: "'Share Tech Mono', monospace" }}
    >
      <span className="text-green-400">{displayedText}</span>
      {cursor && !isComplete && (
        <motion.span
          className="inline-block w-2 h-5 bg-green-400 ml-1"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      )}
    </span>
  );
}

export default TypingText;
