import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Monitor,
  Clock,
  Zap,
  ArrowRight,
  Play,
  Link2,
  Activity,
  Shield,
  Wifi,
} from 'lucide-react';
import { useAuthStore } from '../store';

const StatCard = ({ icon: Icon, value, label, color, delay }) => (
  <motion.div
    className="stat-card group"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`stat-icon ${color}`}>
        <Icon size={20} />
      </div>
      <motion.div
        className="w-12 h-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.3 }}
      >
        <svg viewBox="0 0 48 24" className="w-full h-full">
          <polyline
            points="0,20 8,16 16,18 24,10 32,14 40,6 48,8"
            fill="none"
            stroke={color === 'cyan' ? '#00e5ff' : color === 'purple' ? '#7c3aed' : color === 'green' ? '#22c55e' : '#ec4899'}
            strokeWidth="2"
            opacity="0.5"
          />
        </svg>
      </motion.div>
    </div>
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
  </motion.div>
);

const ActionCard = ({ icon: Icon, title, description, to, variant, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
  >
    <Link to={to}>
      <div className="action-card group">
        <div className={`action-icon ${variant}`}>
          <Icon size={24} />
        </div>
        <h3 className="text-lg font-semibold text-white mb-1.5 relative z-10">{title}</h3>
        <p className="text-sm text-[var(--text-muted)] mb-4 relative z-10 leading-relaxed">{description}</p>
        <div className="flex items-center justify-center gap-2 text-accent text-sm font-semibold relative z-10 group-hover:gap-3 transition-all">
          <span>Get Started</span>
          <ArrowRight size={14} />
        </div>
      </div>
    </Link>
  </motion.div>
);

export default function Dashboard() {
  const { user } = useAuthStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats] = useState({ devices: 3, sessions: 12, activeNow: 1 });

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

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm text-[var(--text-muted)] mb-1">{getGreeting()}</p>
            <h1 className="text-3xl font-bold text-white">
              Welcome, <span className="gradient-text">{user?.name || user?.username || 'User'}</span>
            </h1>
            <p className="text-[var(--text-muted)] text-sm mt-1">Remote desktop control center</p>
          </div>

          <div className="glass-card-static px-4 py-2.5 flex items-center gap-2.5">
            <div className="pulse-dot online" />
            <span className="font-display text-sm text-accent">
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </span>
            <span className="text-[var(--text-dim)] text-xs">
              {currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Monitor} value={stats.devices} label="Connected Devices" color="cyan" delay={0.1} />
        <StatCard icon={Clock} value={stats.sessions} label="Total Sessions" color="purple" delay={0.15} />
        <StatCard icon={Zap} value={stats.activeNow} label="Active Now" color="green" delay={0.2} />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Zap size={18} className="text-accent" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ActionCard
            icon={Play}
            title="Host a Session"
            description="Share your screen and allow others to control your device remotely"
            to="/host"
            variant="host"
            delay={0.25}
          />
          <ActionCard
            icon={Link2}
            title="Join a Session"
            description="Connect to another device using a 6-digit session code"
            to="/join"
            variant="join"
            delay={0.3}
          />
        </div>
      </div>

      {/* System Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Activity size={18} className="text-neon-purple" />
          System Status
        </h2>
        <div className="glass-card">
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: 'Connection', status: 'Operational', icon: Wifi, ok: true },
              { label: 'Encryption', status: 'AES-256 Active', icon: Shield, ok: true },
              { label: 'Latency', status: '< 50ms', icon: Activity, ok: true },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03]">
                <div className="w-9 h-9 rounded-lg bg-[var(--success)]/10 flex items-center justify-center">
                  <item.icon size={16} className="text-[var(--success)]" />
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)]">{item.label}</p>
                  <p className="text-sm font-medium text-[var(--success)]">{item.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Clock size={18} className="text-neon-purple" />
          Recent Activity
        </h2>
        <div className="glass-card">
          <div className="space-y-2">
            {[
              { action: 'Session started', device: 'MacBook Pro', time: '2 hours ago' },
              { action: 'Device connected', device: 'Windows PC', time: '5 hours ago' },
              { action: 'Session ended', device: 'Linux Server', time: 'Yesterday' },
            ].map((activity, i) => (
              <motion.div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.45 + i * 0.05 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Monitor size={14} className="text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{activity.action}</p>
                    <p className="text-xs text-[var(--text-muted)]">{activity.device}</p>
                  </div>
                </div>
                <span className="text-xs text-[var(--text-dim)]">{activity.time}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
