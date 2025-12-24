import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FiMonitor, 
  FiUsers, 
  FiClock, 
  FiZap,
  FiArrowRight,
  FiPlay,
  FiLink
} from 'react-icons/fi';
import { useAuthStore } from '../store';

// Floating Particle Component
const FloatingParticle = ({ delay, duration, x, y }) => (
  <motion.div
    className="absolute w-1 h-1 bg-cyan-400 rounded-full opacity-60"
    style={{ left: `${x}%`, top: `${y}%` }}
    animate={{
      y: [0, -30, 0],
      x: [0, 15, 0],
      opacity: [0.3, 0.8, 0.3],
      scale: [1, 1.5, 1]
    }}
    transition={{
      duration: duration,
      repeat: Infinity,
      delay: delay,
      ease: "easeInOut"
    }}
  />
);

// 3D Stat Card Component
const StatCard = ({ icon: Icon, value, label, color, delay }) => {
  const colorClasses = {
    cyan: 'stat-icon cyan',
    purple: 'stat-icon purple',
    pink: 'stat-icon pink'
  };

  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 40, rotateX: -15 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ 
        scale: 1.05,
        rotateY: 5,
        transition: { duration: 0.3 }
      }}
    >
      <div className={colorClasses[color]}>
        <Icon />
      </div>
      <motion.div 
        className="stat-value"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: delay + 0.2, type: "spring" }}
      >
        {value}
      </motion.div>
      <div className="stat-label">{label}</div>
      
      {/* Animated corner accent */}
      <motion.div
        className="absolute top-0 right-0 w-20 h-20 opacity-20"
        style={{
          background: `radial-gradient(circle at top right, ${color === 'cyan' ? '#00f0ff' : color === 'purple' ? '#7b2cbf' : '#ff006e'}, transparent 70%)`
        }}
        animate={{ opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
    </motion.div>
  );
};

// Action Card Component
const ActionCard = ({ icon: Icon, title, description, to, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ scale: 1.03 }}
  >
    <Link to={to}>
      <div className="action-card group">
        <motion.div 
          className={`action-icon ${color}`}
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.6 }}
        >
          <Icon />
        </motion.div>
        <h3 className="text-xl font-bold text-white mb-2 relative z-10">{title}</h3>
        <p className="text-gray-400 text-sm mb-4 relative z-10">{description}</p>
        <motion.div 
          className="flex items-center justify-center gap-2 text-cyan-400 font-semibold relative z-10"
          whileHover={{ x: 5 }}
        >
          <span>Get Started</span>
          <FiArrowRight />
        </motion.div>
      </div>
    </Link>
  </motion.div>
);

// Main Dashboard Component
export default function Dashboard() {
  const { user } = useAuthStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats] = useState({
    devices: 3,
    sessions: 12,
    activeNow: 1
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Generate particles
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 3 + Math.random() * 3
  }));

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="cyber-bg">
        <div className="grid-3d" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        
        {/* Floating Particles */}
        {particles.map(p => (
          <FloatingParticle key={p.id} {...p} />
        ))}
      </div>

      <div className="relative z-10 p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div 
          className="mb-10"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <motion.h1 
                className="text-4xl lg:text-5xl font-bold mb-2"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <span className="text-white">Welcome back, </span>
                <span className="gradient-text font-display">{user?.name || user?.username || 'User'}</span>
              </motion.h1>
              <motion.p 
                className="text-gray-400 text-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Your remote desktop control center
              </motion.p>
            </div>
            
            {/* Live Clock */}
            <motion.div 
              className="glass-card px-6 py-3"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-center gap-3">
                <div className="pulse-dot online" />
                <span className="font-display text-xl text-cyan-400">
                  {currentTime.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                  })}
                </span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <StatCard 
            icon={FiMonitor} 
            value={stats.devices} 
            label="Connected Devices" 
            color="cyan"
            delay={0.4}
          />
          <StatCard 
            icon={FiClock} 
            value={stats.sessions} 
            label="Total Sessions" 
            color="purple"
            delay={0.5}
          />
          <StatCard 
            icon={FiZap} 
            value={stats.activeNow} 
            label="Active Now" 
            color="pink"
            delay={0.6}
          />
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <FiZap className="text-cyan-400" />
            <span>Quick Actions</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ActionCard
              icon={FiPlay}
              title="Host a Session"
              description="Share your screen and allow others to control your device remotely"
              to="/host"
              color="host"
              delay={0.6}
            />
            <ActionCard
              icon={FiLink}
              title="Join a Session"
              description="Connect to another device using a 6-digit session code"
              to="/join"
              color="join"
              delay={0.7}
            />
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          className="mt-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <FiClock className="text-purple-400" />
            <span>Recent Activity</span>
          </h2>
          
          <div className="glass-card">
            <div className="space-y-4">
              {[
                { action: 'Session started', device: 'MacBook Pro', time: '2 hours ago', status: 'completed' },
                { action: 'Device connected', device: 'Windows PC', time: '5 hours ago', status: 'completed' },
                { action: 'Session ended', device: 'Linux Server', time: 'Yesterday', status: 'completed' }
              ].map((activity, index) => (
                <motion.div
                  key={index}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.9 + index * 0.1 }}
                  whileHover={{ x: 5 }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <FiMonitor className="text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{activity.action}</p>
                      <p className="text-gray-400 text-sm">{activity.device}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-400 text-sm">{activity.time}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          className="mt-10 text-center text-gray-500 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.2 }}
        >
          <p>Let'sClone • Secure Remote Desktop Platform</p>
        </motion.div>
      </div>
    </div>
  );
}
