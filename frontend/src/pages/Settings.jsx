/**
 * Settings Page - Chrome Remote Desktop Style
 */

import { useState, useEffect } from 'react';
import { 
  FiUser, 
  FiShield, 
  FiSave,
  FiLock,
  FiEye,
  FiEyeOff,
  FiSettings,
  FiToggleLeft,
  FiToggleRight
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store';

// Toggle Component
const Toggle = ({ enabled, onChange }) => (
  <button onClick={() => onChange(!enabled)} className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-[#4285f4]' : 'bg-[#3a3a5a]'}`}>
    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${enabled ? 'left-7' : 'left-1'}`} />
  </button>
);

// Setting Row
const SettingRow = ({ label, description, children }) => (
  <div className="flex items-center justify-between py-4 border-b border-[#2d2d4a] last:border-0">
    <div>
      <p className="text-white font-medium">{label}</p>
      {description && <p className="text-[#a0a0b0] text-sm mt-1">{description}</p>}
    </div>
    {children}
  </div>
);

function Settings() {
  const { user, logout, updateProfile, changePassword } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    notifications: true,
    autoConnect: false,
    highQuality: true,
  });

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user]);

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
      if (result?.success) toast.success('Profile updated!');
      else toast.error(result?.error || 'Failed to update');
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
        toast.success('Password changed!');
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <FiSettings className="w-6 h-6 text-[#4285f4]" />
          Settings
        </h1>
        <p className="text-[#a0a0b0] mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FiUser className="w-5 h-5 text-[#4285f4]" />
          Profile
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#a0a0b0] mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full py-3 px-4 bg-[#0a0a15] border border-[#2d2d4a] rounded-lg text-white focus:border-[#4285f4] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-[#a0a0b0] mb-2">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full py-3 px-4 bg-[#0a0a15] border border-[#2d2d4a] rounded-lg text-[#6b6b7b]"
            />
          </div>
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="w-full py-3 rounded-lg bg-[#4285f4] text-white font-medium flex items-center justify-center gap-2 hover:bg-[#5a95f5] transition-colors disabled:opacity-50"
          >
            {saving ? <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <><FiSave className="w-4 h-4" /> Save Profile</>}
          </button>
        </div>
      </div>

      {/* Security */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FiShield className="w-5 h-5 text-[#4285f4]" />
          Security
        </h2>
        <div className="space-y-4">
          <div className="relative">
            <label className="block text-sm text-[#a0a0b0] mb-2">Current Password</label>
            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b6b7b]" />
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full py-3 pl-12 pr-12 bg-[#0a0a15] border border-[#2d2d4a] rounded-lg text-white focus:border-[#4285f4] focus:outline-none"
              />
              <button onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6b6b7b] hover:text-white">
                {showCurrentPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div className="relative">
            <label className="block text-sm text-[#a0a0b0] mb-2">New Password</label>
            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b6b7b]" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full py-3 pl-12 pr-12 bg-[#0a0a15] border border-[#2d2d4a] rounded-lg text-white focus:border-[#4285f4] focus:outline-none"
              />
              <button onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6b6b7b] hover:text-white">
                {showNewPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <button
            onClick={handleChangePassword}
            disabled={saving || !currentPassword || !newPassword}
            className="w-full py-3 rounded-lg bg-[#2a2a4a] text-white font-medium flex items-center justify-center gap-2 hover:bg-[#3a3a5a] transition-colors disabled:opacity-50"
          >
            Change Password
          </button>
        </div>
      </div>

      {/* Preferences */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          {settings.notifications ? <FiToggleRight className="w-5 h-5 text-[#4285f4]" /> : <FiToggleLeft className="w-5 h-5 text-[#4285f4]" />}
          Preferences
        </h2>
        <div className="divide-y divide-[#2d2d4a]">
          <SettingRow label="Notifications" description="Receive connection alerts">
            <Toggle enabled={settings.notifications} onChange={() => handleToggle('notifications')} />
          </SettingRow>
          <SettingRow label="Auto Connect" description="Automatically accept connections">
            <Toggle enabled={settings.autoConnect} onChange={() => handleToggle('autoConnect')} />
          </SettingRow>
          <SettingRow label="High Quality" description="Use high quality video stream">
            <Toggle enabled={settings.highQuality} onChange={() => handleToggle('highQuality')} />
          </SettingRow>
        </div>
      </div>

      {/* Account Actions */}
      <div className="glass-card p-6">
        <button onClick={logout} className="w-full py-3 rounded-lg bg-[#ea4335]/20 text-[#ea4335] font-medium hover:bg-[#ea4335]/30 transition-colors">
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default Settings;
