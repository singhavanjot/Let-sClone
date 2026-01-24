/**
 * Settings Page - Modern Clean Design
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiUser, 
  FiShield, 
  FiMonitor,
  FiBell,
  FiSave,
  FiLogOut,
  FiMoon,
  FiLock,
  FiEye,
  FiEyeOff,
  FiCheck,
  FiCopy,
  FiCpu,
  FiDownload
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store';

// Styled Input Component
const CyberInput = ({ label, type = 'text', value, onChange, placeholder, icon: Icon, rightElement }) => (
  <div className="space-y-2">
    {label && (
      <label className="block text-sm font-medium text-cyan-400/80">{label}</label>
    )}
    <div className="relative group">
      {Icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors">
          <Icon className="w-5 h-5" />
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`
          w-full py-3.5 px-4 ${Icon ? 'pl-12' : ''} ${rightElement ? 'pr-12' : ''}
          bg-[#0a0a15] 
          border-2 border-cyan-500/20 
          rounded-xl 
          text-white 
          placeholder-gray-600
          outline-none
          transition-all duration-300
          focus:border-cyan-500/60
          focus:shadow-[0_0_20px_rgba(0,240,255,0.15)]
          hover:border-cyan-500/40
        `}
      />
      {rightElement && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {rightElement}
        </div>
      )}
      <div className="absolute inset-0 rounded-xl pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10" />
      </div>
    </div>
  </div>
);

// Toggle Component
const Toggle = ({ enabled, onChange, label, description }) => (
  <div className="flex items-center justify-between p-4 rounded-xl bg-[#0a0a15] border border-cyan-500/10 hover:border-cyan-500/30 transition-all">
    <div>
      <p className="text-white font-medium">{label}</p>
      {description && <p className="text-gray-500 text-sm mt-1">{description}</p>}
    </div>
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
        enabled ? 'bg-gradient-to-r from-cyan-500 to-purple-500' : 'bg-gray-700'
      }`}
    >
      <motion.div
        className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg"
        animate={{ left: enabled ? '30px' : '4px' }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  </div>
);

// Setting Section
const SettingSection = ({ icon: Icon, title, children }) => (
  <div className="glass-card p-6">
    <h2 className="text-lg font-semibold text-white mb-5 flex items-center">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center mr-3">
        <Icon className="w-5 h-5 text-cyan-400" />
      </div>
      {title}
    </h2>
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

function Settings() {
  const { user, token, logout, updateProfile, changePassword } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);
  
  // Update name when user changes
  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user]);
  
  // Settings state
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: true,
    autoConnect: false,
    highQuality: true,
    soundEffects: true,
  });

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success('Setting updated');
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    
    setSaving(true);
    try {
      const result = await updateProfile({ name: name.trim() });
      if (result?.success) {
        toast.success('Profile updated successfully!');
      } else {
        toast.error(result?.error || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error('Please fill in both password fields');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    
    setSaving(true);
    try {
      const result = await changePassword(currentPassword, newPassword);
      if (result?.success) {
        toast.success('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
      } else {
        toast.error(result?.error || 'Failed to change password');
      }
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Manage your account and preferences</p>
      </motion.div>

      {/* Profile Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <SettingSection icon={FiUser} title="Profile">
          {/* User Avatar & Info */}
          <div className="flex items-center space-x-4 p-4 rounded-xl bg-[#0a0a15] border border-cyan-500/10 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <span className="text-2xl font-bold text-white">
                {(user?.name || user?.username)?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <p className="text-white font-semibold text-lg">{user?.name || user?.username || 'User'}</p>
              <p className="text-gray-500">{user?.email || 'user@example.com'}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <CyberInput
              label="Display Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              icon={FiUser}
            />
            
            <motion.button
              onClick={handleSaveProfile}
              disabled={saving || !name.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary inline-flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <FiSave className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </motion.button>
          </div>
        </SettingSection>
      </motion.div>

      {/* Security Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <SettingSection icon={FiShield} title="Security">
          <div className="space-y-4">
            <CyberInput
              label="Current Password"
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              icon={FiLock}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="text-gray-500 hover:text-cyan-400 transition-colors p-1"
                >
                  {showCurrentPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              }
            />
            
            <CyberInput
              label="New Password"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              icon={FiLock}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="text-gray-500 hover:text-cyan-400 transition-colors p-1"
                >
                  {showNewPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              }
            />
            
            <motion.button
              onClick={handleChangePassword}
              disabled={saving || !currentPassword || !newPassword}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-secondary inline-flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiLock className="w-4 h-4" />
              <span>Change Password</span>
            </motion.button>
          </div>
        </SettingSection>
      </motion.div>

      {/* Preferences Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <SettingSection icon={FiMonitor} title="Preferences">
          <Toggle
            label="Desktop Notifications"
            description="Receive notifications for session events"
            enabled={settings.notifications}
            onChange={() => handleToggle('notifications')}
          />
          <Toggle
            label="High Quality Streaming"
            description="Use higher quality video (uses more bandwidth)"
            enabled={settings.highQuality}
            onChange={() => handleToggle('highQuality')}
          />
          <Toggle
            label="Auto-reconnect"
            description="Automatically reconnect if connection is lost"
            enabled={settings.autoConnect}
            onChange={() => handleToggle('autoConnect')}
          />
          <Toggle
            label="Sound Effects"
            description="Play sounds for connection events"
            enabled={settings.soundEffects}
            onChange={() => handleToggle('soundEffects')}
          />
        </SettingSection>
      </motion.div>

      {/* Desktop Agent Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <SettingSection icon={FiCpu} title="Desktop Agent">
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20">
            <div className="flex items-start space-x-3">
              <FiDownload className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-white font-medium mb-1">Download Desktop Agent</p>
                <p className="text-gray-400 text-sm mb-4">
                  Run the agent on the host machine to enable full mouse & keyboard control.
                </p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="https://github.com/singhavanjot/Let-sClone/releases/download/v1.0.0/LetsCloneAgent-win32-x64.zip"
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 rounded-lg text-sm transition-colors border border-purple-500/30"
                  >
                    <FiDownload className="w-4 h-4" />
                    <span>Download for Windows</span>
                  </a>
                  <motion.button
                    onClick={() => {
                      if (token) {
                        navigator.clipboard.writeText(token);
                        setTokenCopied(true);
                        toast.success('Auth token copied! Paste it in the agent.');
                        setTimeout(() => setTokenCopied(false), 3000);
                      }
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={!token}
                    className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-sm transition-colors border ${
                      tokenCopied 
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                        : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border-cyan-500/30'
                    } disabled:opacity-50`}
                  >
                    {tokenCopied ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                    <span>{tokenCopied ? 'Token Copied!' : 'Copy Auth Token'}</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </SettingSection>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-6 border-red-500/30"
      >
        <h2 className="text-lg font-semibold text-red-400 mb-4 flex items-center">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center mr-3">
            <FiLogOut className="w-5 h-5 text-red-400" />
          </div>
          Danger Zone
        </h2>
        <p className="text-gray-400 text-sm mb-4">
          Once you log out, you'll need to sign in again to access your account.
        </p>
        <motion.button
          onClick={logout}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn-danger inline-flex items-center space-x-2"
        >
          <FiLogOut className="w-4 h-4" />
          <span>Log Out</span>
        </motion.button>
      </motion.div>
    </div>
  );
}

export default Settings;
