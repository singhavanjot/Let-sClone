import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiHome,
  FiMonitor,
  FiLink,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiZap
} from 'react-icons/fi';
import { useAuthStore } from '../store';

const navItems = [
  { path: '/dashboard', icon: FiHome, label: 'Dashboard', color: '#00f0ff' },
  { path: '/host', icon: FiMonitor, label: 'Host Session', color: '#7b2cbf' },
  { path: '/join', icon: FiLink, label: 'Join Session', color: '#ff006e' },
  { path: '/settings', icon: FiSettings, label: 'Settings', color: '#00ff88' }
];

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-[#050508]">
      {/* Mobile Menu Button */}
      <motion.button
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-[#0f0f1a] rounded-xl border border-cyan-500/20"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        whileTap={{ scale: 0.95 }}
      >
        {sidebarOpen ? <FiX className="text-cyan-400" /> : <FiMenu className="text-cyan-400" />}
      </motion.button>

      {/* Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || window.innerWidth >= 1024) && (
          <motion.aside
            className="sidebar fixed lg:relative w-72 h-screen z-40 flex flex-col"
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {/* Logo */}
            <div className="p-6 border-b border-cyan-500/10">
              <Link to="/dashboard" className="flex items-center gap-3">
                <motion.div
                  className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center"
                  whileHover={{ rotate: 180, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                >
                  <FiZap className="text-white text-xl" />
                </motion.div>
                <div>
                  <h1 className="font-display font-bold text-lg text-white">Let'sClone</h1>
                  <p className="text-xs text-cyan-400">Remote Desktop</p>
                </div>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
              {navItems.map((item, index) => {
                const isActive = location.pathname === item.path;
                return (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link to={item.path} onClick={() => setSidebarOpen(false)}>
                      <motion.div
                        className={`nav-item ${isActive ? 'active' : ''}`}
                        whileHover={{ x: 5 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          borderLeft: isActive ? `3px solid ${item.color}` : 'none',
                          background: isActive ? `${item.color}15` : 'transparent'
                        }}
                      >
                        <item.icon 
                          style={{ color: isActive ? item.color : 'inherit' }}
                          className="text-lg"
                        />
                        <span>{item.label}</span>
                        
                        {isActive && (
                          <motion.div
                            className="absolute right-3 w-2 h-2 rounded-full"
                            style={{ background: item.color }}
                            animate={{ 
                              boxShadow: [`0 0 10px ${item.color}`, `0 0 20px ${item.color}`, `0 0 10px ${item.color}`]
                            }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                        )}
                      </motion.div>
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-cyan-500/10">
              {/* Time Display */}
              <motion.div 
                className="mb-4 p-3 rounded-xl bg-white/5 text-center"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="font-display text-xl text-cyan-400">
                  {currentTime.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                  })}
                </span>
              </motion.div>

              {/* User Info */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {(user?.name || user?.username)?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">
                    {user?.name || user?.username || 'User'}
                  </p>
                  <p className="text-gray-500 text-xs truncate">
                    {user?.email || 'user@example.com'}
                  </p>
                </div>
              </div>

              {/* Logout Button */}
              <motion.button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FiLogOut />
                <span className="font-medium">Logout</span>
              </motion.button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="lg:hidden fixed inset-0 bg-black/50 z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-auto lg:ml-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
