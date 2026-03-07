import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, ArrowRight, Zap, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();

  const validate = () => {
    const e = {};
    if (!name) e.name = 'Name is required';
    if (!email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email format';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Must be at least 6 characters';
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const result = await register(email, password, name);
    if (result.success) { toast.success('Account created!'); navigate('/dashboard'); }
    else toast.error(result.error || 'Registration failed');
  };

  const InputField = ({ label, icon: Icon, type = 'text', value, onChange, placeholder, error, rightEl }) => (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-accent/80">{label}</label>
      <div className="relative group">
        <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)] group-focus-within:text-accent transition-colors" />
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full py-3 pl-10 ${rightEl ? 'pr-10' : 'pr-4'} bg-[var(--bg)] border-[1.5px] ${error ? 'border-[var(--danger)]/50' : 'border-[var(--border)]'} rounded-xl text-white text-sm placeholder-[var(--text-dim)] outline-none transition-all focus:border-accent focus:shadow-[0_0_12px_var(--accent-glow)] hover:border-[var(--border-hover)]`}
        />
        {rightEl}
      </div>
      {error && <p className="text-[var(--danger)] text-xs">{error}</p>}
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[var(--bg)] relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="grid-3d" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-16 z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-sm">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-neon-purple flex items-center justify-center">
              <Zap className="text-white" size={22} />
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl text-white">Let'sClone</h1>
              <p className="text-accent/70 text-xs font-medium">REMOTE DESKTOP</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white mb-3 leading-tight">
            Start your journey with <span className="gradient-text">secure remote access</span>
          </h2>
          <p className="text-[var(--text-muted)] mb-8">
            Join thousands of users who trust Let'sClone for their remote desktop needs.
          </p>

          <div className="space-y-3">
            {['Free account with full features', 'No credit card required', 'Setup in under 2 minutes'].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-5 h-5 rounded-full bg-accent/15 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                </div>
                <span className="text-sm text-[var(--text-muted)]">{f}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-neon-purple flex items-center justify-center">
              <Zap className="text-white" size={18} />
            </div>
            <h1 className="font-display font-bold text-xl text-white">Let'sClone</h1>
          </div>

          <div className="glass-card p-7">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-1">Create Account</h2>
              <p className="text-[var(--text-muted)] text-sm">Get started with your free account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <InputField label="Full Name" icon={User} value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" error={errors.name} />
              <InputField label="Email" icon={Mail} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" error={errors.email} />
              <InputField
                label="Password"
                icon={Lock}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                error={errors.password}
                rightEl={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)] hover:text-accent transition-colors">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
              <InputField
                label="Confirm Password"
                icon={Lock}
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                error={errors.confirmPassword}
              />

              <motion.button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50 mt-2"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </motion.button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-[var(--text-muted)] text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-accent font-semibold hover:text-accent/80 transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

