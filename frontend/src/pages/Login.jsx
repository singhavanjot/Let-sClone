import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiArrowRight, FiZap, FiShield, FiGlobe, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuthStore } from '../store';
import { FloatingTechDoodles } from '../components';
import toast from 'react-hot-toast';

// Animated Background Grid
const AnimatedGrid = () => (
  <div className="absolute inset-0 overflow-hidden">
    <div className="grid-3d" />
    <div className="orb orb-1" />
    <div className="orb orb-2" />
  </div>
);

// Feature Item
const FeatureItem = ({ icon: Icon, title, delay }) => (
  <motion.div
    className="flex items-center gap-4"
    initial={{ opacity: 0, x: -30 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5, delay }}
  >
    <motion.div 
      className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center"
      whileHover={{ scale: 1.1, rotate: 5 }}
    >
      <Icon className="text-cyan-400 text-xl" />
    </motion.div>
    <span className="text-white font-medium">{title}</span>
  </motion.div>
);

// Modern Input Component
const CyberInput = ({ label, type = 'text', value, onChange, placeholder, icon: Icon, rightElement, error }) => (
  <div className="space-y-2">
    {label && (
      <label className="block text-sm font-medium text-cyan-400/80">{label}</label>
    )}
    <div className="relative group">
      {Icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors z-10">
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
          border-2 ${error ? 'border-red-500/50' : 'border-cyan-500/20'}
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
        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
          {rightElement}
        </div>
      )}
    </div>
    {error && <p className="text-red-400 text-sm">{error}</p>}
  </div>
);

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

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    const result = await login(email, password);
    
    if (result.success) {
      toast.success('Welcome back!');
      navigate('/dashboard');
    } else {
      setError(result.error || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex bg-[#050508] relative overflow-hidden">
      <AnimatedGrid />
      <FloatingTechDoodles count={25} opacity={0.12} />

      {/* Left Side - Branding */}
      <motion.div 
        className="hidden lg:flex flex-col justify-center w-1/2 p-12 relative z-10"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Logo */}
        <motion.div 
          className="flex items-center gap-4 mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <motion.div
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center"
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.5 }}
          >
            <FiZap className="text-white text-3xl" />
          </motion.div>
          <div>
            <h1 className="font-display font-bold text-3xl text-white">Let'sClone</h1>
            <p className="text-cyan-400">Remote Desktop</p>
          </div>
        </motion.div>

        {/* Tagline */}
        <motion.h2
          className="text-5xl font-bold mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <span className="text-white">Control </span>
          <span className="gradient-text font-display">Anywhere</span>
          <br />
          <span className="text-white">Connect </span>
          <span className="text-glow text-cyan-400 font-display">Anytime</span>
        </motion.h2>

        <motion.p
          className="text-gray-400 text-lg mb-12 max-w-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          Experience seamless remote desktop access with military-grade encryption and lightning-fast connections.
        </motion.p>

        {/* Features */}
        <div className="space-y-6">
          <FeatureItem icon={FiShield} title="End-to-End Encryption" delay={0.5} />
          <FeatureItem icon={FiZap} title="Ultra-Low Latency" delay={0.6} />
          <FeatureItem icon={FiGlobe} title="Global Access Network" delay={0.7} />
        </div>
      </motion.div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {/* Mobile Logo */}
          <motion.div 
            className="lg:hidden flex items-center justify-center gap-3 mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
              <FiZap className="text-white text-xl" />
            </div>
            <h1 className="font-display font-bold text-2xl text-white">Let'sClone</h1>
          </motion.div>

          <div className="glass-card p-8">
            <motion.div 
              className="text-center mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
              <p className="text-gray-400">Sign in to access your control center</p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
              >
                <CyberInput
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  icon={FiMail}
                />
              </motion.div>

              {/* Password Input */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
              >
                <CyberInput
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  icon={FiLock}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-500 hover:text-cyan-400 transition-colors p-1"
                    >
                      {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                    </button>
                  }
                />
              </motion.div>

              {/* Error Message */}
              {(error || storeError) && (
                <motion.div
                  className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  {error || storeError}
                </motion.div>
              )}

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex items-center justify-center gap-3 py-4 disabled:opacity-50"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.7 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <FiArrowRight />
                  </>
                )}
              </motion.button>
            </form>

            {/* Register Link */}
            <motion.div 
              className="mt-8 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.8 }}
            >
              <p className="text-gray-400">
                Don't have an account?{' '}
                <Link 
                  to="/register" 
                  className="text-cyan-400 font-semibold hover:text-cyan-300 transition-colors"
                >
                  Create Account
                </Link>
              </p>
            </motion.div>
          </div>

          {/* Version Tag */}
          <motion.p
            className="text-center text-gray-600 text-sm mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.9 }}
          >
            Let'sClone v2.0 • Secure Connection
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
