import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Zap, Shield, Globe, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading, error: storeError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields'); return; }
    const result = await login(email, password);
    if (result.success) { toast.success('Welcome back!'); navigate('/dashboard'); }
    else setError(result.error || 'Login failed. Please try again.');
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg)] relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0">
        <div className="grid-3d" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
      </div>

      {/* Left - Branding */}
      <div className="hidden lg:flex flex-col justify-center w-1/2 p-16 relative z-10">
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-neon-purple flex items-center justify-center">
              <Zap className="text-white" size={22} />
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl text-white tracking-wide">Let'sClone</h1>
              <p className="text-accent/70 text-xs font-medium">REMOTE DESKTOP</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold mb-4 leading-tight">
            <span className="text-white">Control </span>
            <span className="gradient-text">Anywhere</span>
            <br />
            <span className="text-white">Connect </span>
            <span className="text-accent font-display text-glow">Anytime</span>
          </h2>

          <p className="text-[var(--text-muted)] text-base mb-10 max-w-sm leading-relaxed">
            Seamless remote desktop access with end-to-end encryption and ultra-low latency.
          </p>

          <div className="space-y-4">
            {[
              { icon: Shield, text: 'End-to-End Encryption' },
              { icon: Zap, text: 'Ultra-Low Latency' },
              { icon: Globe, text: 'Global Access Network' },
            ].map((f, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                  <f.icon size={16} className="text-accent" />
                </div>
                <span className="text-sm text-[var(--text)] font-medium">{f.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-neon-purple flex items-center justify-center">
              <Zap className="text-white" size={18} />
            </div>
            <h1 className="font-display font-bold text-xl text-white">Let'sClone</h1>
          </div>

          <div className="glass-card p-7">
            <div className="text-center mb-7">
              <h2 className="text-2xl font-bold text-white mb-1">Welcome Back</h2>
              <p className="text-[var(--text-muted)] text-sm">Sign in to your control center</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-accent/80">Email</label>
                <div className="relative group">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)] group-focus-within:text-accent transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full py-3 pl-10 pr-4 bg-[var(--bg)] border-[1.5px] border-[var(--border)] rounded-xl text-white text-sm placeholder-[var(--text-dim)] outline-none transition-all focus:border-accent focus:shadow-[0_0_12px_var(--accent-glow)] hover:border-[var(--border-hover)]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-accent/80">Password</label>
                <div className="relative group">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)] group-focus-within:text-accent transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full py-3 pl-10 pr-10 bg-[var(--bg)] border-[1.5px] border-[var(--border)] rounded-xl text-white text-sm placeholder-[var(--text-dim)] outline-none transition-all focus:border-accent focus:shadow-[0_0_12px_var(--accent-glow)] hover:border-[var(--border-hover)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)] hover:text-accent transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {(error || storeError) && (
                <div className="p-3 bg-[var(--danger)]/8 border border-[var(--danger)]/20 rounded-xl text-[var(--danger)] text-xs text-center">
                  {error || storeError}
                </div>
              )}

              <motion.button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </motion.button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-[var(--text-muted)] text-sm">
                Don't have an account?{' '}
                <Link to="/register" className="text-accent font-semibold hover:text-accent/80 transition-colors">
                  Create one
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

