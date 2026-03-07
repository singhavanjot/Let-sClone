import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User, Shield, Monitor, Save, LogOut, Lock,
  Eye, EyeOff, Check, Copy, Cpu, Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store';

/* ─── Reusable sub-components ─── */

function SettingInput({ label, type = 'text', value, onChange, placeholder, icon: Icon, rightElement }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-xs font-medium text-[var(--text-secondary)]">{label}</label>}
      <div className="relative group">
        {Icon && (
          <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-accent transition-colors" />
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`cyber-input w-full ${Icon ? 'pl-10' : ''} ${rightElement ? 'pr-10' : ''}`}
        />
        {rightElement && <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>}
      </div>
    </div>
  );
}

function Toggle({ enabled, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        {description && <p className="text-xs text-[var(--text-muted)] mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-accent' : 'bg-white/10'}`}
      >
        <motion.div
          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
          animate={{ left: enabled ? '24px' : '4px' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}

function Section({ icon: Icon, title, children, variant }) {
  return (
    <div className={`glass-card-static p-5 ${variant === 'danger' ? 'border-neon-red/20' : ''}`}>
      <h2 className={`text-sm font-semibold mb-4 flex items-center gap-2.5
        ${variant === 'danger' ? 'text-neon-red' : 'text-white'}`}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center
          ${variant === 'danger' ? 'bg-neon-red/10' : 'bg-accent/10'}`}>
          <Icon size={16} className={variant === 'danger' ? 'text-neon-red' : 'text-accent'} />
        </div>
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

/* ─── Main Component ─── */

function Settings() {
  const { user, token, logout, updateProfile, changePassword } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);

  useEffect(() => { if (user?.name) setName(user.name); }, [user]);

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
    if (!name.trim()) { toast.error('Name cannot be empty'); return; }
    setSaving(true);
    try {
      const result = await updateProfile({ name: name.trim() });
      if (result?.success) toast.success('Profile updated!');
      else toast.error(result?.error || 'Failed to update profile');
    } catch { toast.error('Failed to update profile'); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) { toast.error('Please fill in both password fields'); return; }
    if (newPassword.length < 6) { toast.error('New password must be at least 6 characters'); return; }
    setSaving(true);
    try {
      const result = await changePassword(currentPassword, newPassword);
      if (result?.success) {
        toast.success('Password changed!');
        setCurrentPassword('');
        setNewPassword('');
      } else toast.error(result?.error || 'Failed to change password');
    } catch { toast.error('Failed to change password'); }
    finally { setSaving(false); }
  };

  const handleCopyToken = () => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setTokenCopied(true);
    toast.success('Auth token copied!');
    setTimeout(() => setTokenCopied(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 p-4 md:p-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-white mb-1">Settings</h1>
        <p className="text-sm text-[var(--text-secondary)]">Manage your account and preferences</p>
      </motion.div>

      {/* Profile */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Section icon={User} title="Profile">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-neon-purple flex items-center justify-center shadow-neon">
              <span className="text-lg font-bold text-white">
                {(user?.name || user?.username)?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <p className="text-white font-medium">{user?.name || user?.username || 'User'}</p>
              <p className="text-xs text-[var(--text-muted)]">{user?.email || 'user@example.com'}</p>
            </div>
          </div>

          <SettingInput
            label="Display Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            icon={User}
          />

          <button
            onClick={handleSaveProfile}
            disabled={saving || !name.trim()}
            className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
            Save Changes
          </button>
        </Section>
      </motion.div>

      {/* Security */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Section icon={Shield} title="Security">
          <SettingInput
            label="Current Password"
            type={showCurrentPassword ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
            icon={Lock}
            rightElement={
              <button onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="text-[var(--text-muted)] hover:text-accent transition-colors">
                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
          <SettingInput
            label="New Password"
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            icon={Lock}
            rightElement={
              <button onClick={() => setShowNewPassword(!showNewPassword)}
                className="text-[var(--text-muted)] hover:text-accent transition-colors">
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
          <button
            onClick={handleChangePassword}
            disabled={saving || !currentPassword || !newPassword}
            className="btn-secondary flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Lock size={14} /> Change Password
          </button>
        </Section>
      </motion.div>

      {/* Preferences */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Section icon={Monitor} title="Preferences">
          <Toggle label="Desktop Notifications"   description="Receive notifications for session events"    enabled={settings.notifications} onChange={() => handleToggle('notifications')} />
          <Toggle label="High Quality Streaming"   description="Higher quality video (uses more bandwidth)"  enabled={settings.highQuality}   onChange={() => handleToggle('highQuality')} />
          <Toggle label="Auto-reconnect"           description="Reconnect automatically if connection drops" enabled={settings.autoConnect}   onChange={() => handleToggle('autoConnect')} />
          <Toggle label="Sound Effects"            description="Play sounds for connection events"           enabled={settings.soundEffects}  onChange={() => handleToggle('soundEffects')} />
        </Section>
      </motion.div>

      {/* Desktop Agent */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Section icon={Cpu} title="Desktop Agent">
          <div className="p-4 rounded-lg bg-neon-purple/5 border border-neon-purple/15">
            <div className="flex items-start gap-3">
              <Download size={18} className="text-neon-purple mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-white mb-1">Download Desktop Agent</p>
                <p className="text-xs text-[var(--text-muted)] mb-3">
                  Run the agent on the host machine to enable full mouse & keyboard control.
                </p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href="https://github.com/singhavanjot/Let-sClone/releases/download/v1.0.0/LetsCloneAgent-win32-x64.zip"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neon-purple/10 text-neon-purple hover:bg-neon-purple/20 rounded-lg text-xs transition-colors border border-neon-purple/20"
                  >
                    <Download size={12} /> Windows
                  </a>
                  <button
                    onClick={handleCopyToken}
                    disabled={!token}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors border disabled:opacity-50
                      ${tokenCopied
                        ? 'bg-neon-green/10 text-neon-green border-neon-green/20'
                        : 'bg-accent/10 text-accent hover:bg-accent/20 border-accent/20'}`}
                  >
                    {tokenCopied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy Auth Token</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Section>
      </motion.div>

      {/* Danger Zone */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Section icon={LogOut} title="Danger Zone" variant="danger">
          <p className="text-xs text-[var(--text-muted)]">
            Once you log out, you'll need to sign in again to access your account.
          </p>
          <button onClick={logout} className="btn-danger flex items-center gap-2 text-sm">
            <LogOut size={14} /> Log Out
          </button>
        </Section>
      </motion.div>
    </div>
  );
}

export default Settings;
