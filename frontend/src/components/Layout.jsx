/**
 * Layout Component
 * Main application layout with navigation
 */

import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FiHome, 
  FiMonitor, 
  FiLink, 
  FiSettings, 
  FiLogOut, 
  FiMenu, 
  FiX,
  FiUser
} from 'react-icons/fi';
import { useAuthStore } from '../store';
import toast from 'react-hot-toast';

function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: FiHome },
    { name: 'Host Session', href: '/host', icon: FiMonitor },
    { name: 'Join Session', href: '/join', icon: FiLink },
    { name: 'Settings', href: '/settings', icon: FiSettings },
  ];

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-dark-800 border-r border-dark-700
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-dark-700">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <FiMonitor className="w-8 h-8 text-primary-500" />
            <span className="text-xl font-bold text-white">RemoteDesk</span>
          </Link>
          <button
            className="lg:hidden text-gray-400 hover:text-white"
            onClick={() => setIsSidebarOpen(false)}
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  flex items-center px-4 py-3 rounded-lg transition-colors
                  ${isActive(item.href)
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-400 hover:bg-dark-700 hover:text-white'
                  }
                `}
                onClick={() => setIsSidebarOpen(false)}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-dark-700">
          <div className="flex items-center px-4 py-3 mb-2 rounded-lg bg-dark-700">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-600">
              <FiUser className="w-5 h-5 text-white" />
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-gray-400 rounded-lg hover:bg-dark-700 hover:text-white transition-colors"
          >
            <FiLogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex items-center h-16 px-4 bg-dark-800 border-b border-dark-700 lg:hidden">
          <button
            className="text-gray-400 hover:text-white"
            onClick={() => setIsSidebarOpen(true)}
          >
            <FiMenu className="w-6 h-6" />
          </button>
          <div className="flex items-center ml-4 space-x-2">
            <FiMonitor className="w-6 h-6 text-primary-500" />
            <span className="text-lg font-bold text-white">RemoteDesk</span>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
