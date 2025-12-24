/**
 * Floating Tech Doodles Component
 * Animated floating tech icons for background decoration
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FiCpu,
  FiCode,
  FiTerminal,
  FiWifi,
  FiDatabase,
  FiCloud,
  FiServer,
  FiGitBranch,
  FiLayers,
  FiBox,
  FiGlobe,
  FiHardDrive,
  FiShare2,
  FiCommand,
  FiAperture,
  FiZap,
  FiMonitor,
  FiSmartphone,
  FiCast,
  FiActivity
} from 'react-icons/fi';

// Tech doodle icons
const techIcons = [
  FiCpu, FiCode, FiTerminal, FiWifi, FiDatabase, FiCloud, 
  FiServer, FiGitBranch, FiLayers, FiBox, FiGlobe, FiHardDrive,
  FiShare2, FiCommand, FiAperture, FiZap, FiMonitor, FiSmartphone,
  FiCast, FiActivity
];

export default function FloatingTechDoodles({ count = 20, opacity = 0.15 }) {
  const doodles = useMemo(() => {
    return [...Array(count)].map((_, i) => ({
      id: i,
      Icon: techIcons[i % techIcons.length],
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 14 + Math.random() * 18,
      duration: 18 + Math.random() * 25,
      delay: Math.random() * -20,
      rotateStart: Math.random() * 360,
      pathVariant: i % 4
    }));
  }, [count]);

  // Different animation paths for variety
  const animationVariants = {
    0: { // Circular float
      x: [0, 30, 0, -30, 0],
      y: [0, -30, -60, -30, 0],
    },
    1: { // Diagonal drift up
      x: [0, 40, 80],
      y: [0, -80, -160],
    },
    2: { // Zigzag
      x: [0, 25, -25, 25, 0],
      y: [0, -40, -80, -120, -160],
    },
    3: { // Gentle wave
      x: [0, 35, 0, -35, 0, 35, 0],
      y: [0, -25, -50, -75, -100, -125, -150],
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {doodles.map((doodle) => {
        const { Icon, x, y, size, duration, delay, rotateStart, pathVariant, id } = doodle;

        return (
          <motion.div
            key={id}
            className="absolute"
            style={{
              left: `${x}%`,
              top: `${y}%`,
            }}
            initial={{ 
              opacity: 0,
              rotate: rotateStart 
            }}
            animate={{
              opacity: [0, opacity, opacity * 0.7, opacity, 0],
              rotate: [rotateStart, rotateStart + 180, rotateStart + 360],
              ...animationVariants[pathVariant]
            }}
            transition={{
              duration,
              delay,
              repeat: Infinity,
              ease: 'linear'
            }}
          >
            <Icon 
              size={size} 
              className="text-white"
              style={{ 
                filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.15))'
              }}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
