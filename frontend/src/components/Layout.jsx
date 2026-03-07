import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Monitor,
  Link2,
  Settings,
  LogOut,
  Menu,
  X,
  Zap,
  ChevronLeft,
  Shield,
} from 'lucide-react';
import { useAuthStore } from '../store';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/host', icon: Monitor, label: 'Host Session' },
  { path: '/join', icon: Link2, label: 'Join Session' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarWidth = collapsed ? 'w-[72px]' : 'w-64';

  return (
    <div className="min-h-screen flex bg-[#0b0f19] relative">
      {/* Mobile menu */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-surface-50 rounded-xl border border-accent/15 text-accent"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          sidebar fixed lg:sticky top-0 h-screen z-40 flex flex-col transition-all duration-300
          ${sidebarWidth}
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className={`p-4 border-b border-accent/8 flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-neon-purple flex items-center justify-center flex-shrink-0">
            <Zap className="text-white" size={18} />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="font-display font-bold text-sm text-white tracking-wide">Let'sClone</h1>
              <p className="text-[10px] text-accent/70 font-medium">REMOTE DESKTOP</p>
            </div>
          )}
        </div>

        {/* Nav label */}
        {!collapsed && (
          <div className="px-4 pt-5 pb-2">
            <span className="text-[10px] font-semibold text-text-dim uppercase tracking-widest">Navigation</span>
          </div>
        )}

        {/* Navigation */}
        <nav className={`flex-1 ${collapsed ? 'px-2 pt-4' : 'px-3'} space-y-1 overflow-y-auto`}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}>
                <motion.div
                  className={`nav-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`}
                  whileTap={{ scale: 0.97 }}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon size={18} className={isActive ? 'text-accent' : ''} />
                  {!collapsed && <span>{item.label}</span>}
                  {isActive && !collapsed && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_6px_var(--accent)]" />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle - desktop only */}
        <button
          className="hidden lg:flex items-center justify-center p-2 mx-3 mb-2 rounded-lg text-text-dim hover:text-text hover:bg-white/5 transition-colors"
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronLeft size={16} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>

        {/* User section */}
        <div className="p-3 border-t border-accent/8">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} p-2 rounded-xl bg-white/[0.03] mb-2`}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/80 to-neon-purple flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">
                {(user?.name || user?.username)?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-xs truncate">
                  {user?.name || user?.username || 'User'}
                </p>
                <p className="text-text-dim text-[10px] truncate">
                  {user?.email || 'user@example.com'}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-2'} p-2 rounded-lg text-neon-red/80 hover:bg-neon-red/8 hover:text-neon-red transition-colors text-sm`}
            title={collapsed ? 'Logout' : undefined}
          >
            <LogOut size={16} />
            {!collapsed && <span className="font-medium text-xs">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 overflow-auto relative z-10 min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="min-h-screen"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
