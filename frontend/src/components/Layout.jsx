/**
 * Layout Component - Clean Chrome Remote Desktop Style
 */

import { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  FiHome,
  FiMonitor,
  FiLink,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiWifi
} from 'react-icons/fi';
import { useAuthStore } from '../store';

const navItems = [
  { path: '/dashboard', icon: FiHome, label: 'Home' },
  { path: '/host', icon: FiMonitor, label: 'Remote Support' },
  { path: '/join', icon: FiLink, label: 'Remote Access' },
  { path: '/settings', icon: FiSettings, label: 'Settings' }
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-[#16213e]">
      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-[#1f1f3a] rounded-lg border border-[#2d2d4a]"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? (
          <FiX className="w-5 h-5 text-white" />
        ) : (
          <FiMenu className="w-5 h-5 text-white" />
        )}
      </button>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="p-6 border-b border-[#2d2d4a]">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4285f4] to-[#34a853] flex items-center justify-center">
              <FiWifi className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Let'\''sClone</h1>
              <p className="text-xs text-[#a0a0b0]">Remote Desktop</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-[#2d2d4a]">
          {/* User Info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[#2a2a4a] mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4285f4] to-[#1a73e8] flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {(user?.name || user?.username)?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate">
                {user?.name || user?.username || 'User'}
              </p>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#34a853]"></span>
                <span className="text-[#34a853] text-xs">Online</span>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-lg text-[#ea4335] hover:bg-[#ea4335]/10 transition-all"
          >
            <FiLogOut className="w-4 h-4" />
            <span className="font-medium text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-[260px] min-h-screen">
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
