import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FiMonitor, 
  FiClock, 
  FiZap,
  FiArrowRight,
  FiPlay,
  FiLink
} from 'react-icons/fi';
import { useAuthStore } from '../store';

const cn = (...classes) => classes.filter(Boolean).join(' ');

// Floating Particle Component
const FloatingParticle = ({ delay, duration, x, y }) => (
  <motion.div
    className="absolute w-1 h-1 bg-cyan-400 rounded-full opacity-60"
    style={{ left: `${x}%`, top: `${y}%` }}
    animate={{
      y: [0, -30, 0],
      x: [0, 15, 0],
      opacity: [0.3, 0.8, 0.3],
      scale: [1, 1.5, 1]
    }}
    transition={{
      duration: duration,
      repeat: Infinity,
      delay: delay,
      ease: "easeInOut"
    }}
  />
);

// Action Card Component
const ActionCard = ({ icon: Icon, title, description, to, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ scale: 1.03 }}
  >
    <Link to={to}>
      <div className="action-card group">
        <motion.div 
          className={`action-icon ${color}`}
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.6 }}
        >
          <Icon />
        </motion.div>
        <h3 className="text-xl font-bold text-white mb-2 relative z-10">{title}</h3>
        <p className="text-gray-400 text-sm mb-4 relative z-10">{description}</p>
        <motion.div 
          className="flex items-center justify-center gap-2 text-cyan-400 font-semibold relative z-10"
          whileHover={{ x: 5 }}
        >
          <span>Get Started</span>
          <FiArrowRight />
        </motion.div>
      </div>
    </Link>
  </motion.div>
);

function ElegantShape({
  className,
  delay = 0,
  width = 400,
  height = 100,
  rotate = 0,
  gradient = 'from-white/[0.08]'
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: -150,
        rotate: rotate - 15
      }}
      animate={{
        opacity: 1,
        y: 0,
        rotate
      }}
      transition={{
        duration: 2.4,
        delay,
        ease: [0.23, 0.86, 0.39, 0.96],
        opacity: { duration: 1.2 }
      }}
      className={cn('absolute', className)}
    >
      <motion.div
        animate={{ y: [0, 15, 0] }}
        transition={{
          duration: 12,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'easeInOut'
        }}
        style={{ width, height }}
        className="relative"
      >
        <div
          className={cn(
            'absolute inset-0 rounded-full',
            'bg-gradient-to-r to-transparent',
            gradient,
            'backdrop-blur-[2px] border-2 border-white/[0.15]',
            'shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]',
            'after:absolute after:inset-0 after:rounded-full',
            'after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]'
          )}
        />
      </motion.div>
    </motion.div>
  );
}

function HeroGeometric({
  badge = 'Lets Clone',
  title2 = 'Elevate Your Screening'
}) {
  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        delay: 0.5 + i * 0.2,
        ease: [0.25, 0.4, 0.25, 1]
      }
    })
  };

  return (
    <div className="relative w-full min-h-[460px] flex items-center justify-center overflow-hidden mb-12 rounded-[32px]">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-rose-500/[0.05] blur-3xl" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#030303]/20 to-transparent" />

      <div className="absolute inset-0 overflow-hidden">
        <ElegantShape
          delay={0.3}
          width={600}
          height={140}
          rotate={12}
          gradient="from-indigo-500/[0.15]"
          className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]"
        />

        <ElegantShape
          delay={0.5}
          width={500}
          height={120}
          rotate={-15}
          gradient="from-rose-500/[0.15]"
          className="right-[-5%] md:right-[0%] top-[70%] md:top-[75%]"
        />

        <ElegantShape
          delay={0.4}
          width={300}
          height={80}
          rotate={-8}
          gradient="from-violet-500/[0.15]"
          className="left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]"
        />

        <ElegantShape
          delay={0.6}
          width={200}
          height={60}
          rotate={20}
          gradient="from-amber-500/[0.15]"
          className="right-[15%] md:right-[20%] top-[10%] md:top-[15%]"
        />

        <ElegantShape
          delay={0.7}
          width={150}
          height={40}
          rotate={-25}
          gradient="from-cyan-500/[0.15]"
          className="left-[20%] md:left-[25%] top-[5%] md:top-[10%]"
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            custom={0}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="inline-flex items-center gap-3 px-7 py-3 rounded-full bg-white/[0.04] border border-white/[0.1] mb-8 md:mb-10"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
            <span className="text-lg md:text-xl font-semibold text-white/85 tracking-wide">{badge}</span>
          </motion.div>

          <motion.div
            custom={1}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
          >
            <h1 className="font-bold mb-4 md:mb-6 tracking-tight">
              <span className="block text-xl sm:text-2xl md:text-3xl text-white/90 font-semibold mb-3">
                {title1}
              </span>
              <span className="inline-block px-4 py-2 text-4xl sm:text-6xl md:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white/90 to-rose-300">
                {title2}
              </span>
            </h1>
          </motion.div>

          <motion.div
            custom={2}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
          >
            <p className="text-sm sm:text-base text-white/55 max-w-2xl mx-auto leading-relaxed">
              Your remote desktop control center
            </p>
          </motion.div>
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-[#030303]/80 via-transparent to-[#030303]/70 pointer-events-none" />
    </div>
  );
}

// Main Dashboard Component
export default function Dashboard() {
  const { user } = useAuthStore();

  // Generate particles
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 3 + Math.random() * 3
  }));

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Animated Background */}
      <div className="cyber-bg">
        <div className="grid-3d" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        
        {/* Floating Particles */}
        {particles.map(p => (
          <FloatingParticle key={p.id} {...p} />
        ))}
      </div>

      <div className="relative z-10 p-6 lg:p-8 max-w-7xl mx-auto">
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl lg:text-5xl font-bold mb-2">
            <span className="text-white">Welcome back, </span>
            <span className="gradient-text font-display">{user?.name || user?.username || 'User'}</span>
          </h1>
        </motion.div>

        <HeroGeometric
          badge="Lets Clone"
          title1="Lets Clone"
          title2="Elevate Your Screening"
        />

        {/* Quick Actions */}
        <motion.div
          className="relative z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h2 className="inline-flex text-2xl font-bold text-white mb-6 items-center gap-3 px-4 py-2 rounded-xl bg-[#101427]/65 border border-cyan-500/20 backdrop-blur-sm">
            <FiZap className="text-cyan-400" />
            <span>Quick Actions</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 rounded-2xl">
            <ActionCard
              icon={FiPlay}
              title="Host a Session"
              description="Share your screen and allow others to control your device remotely"
              to="/host"
              color="host"
              delay={0.6}
            />
            <ActionCard
              icon={FiLink}
              title="Join a Session"
              description="Connect to another device using a 6-digit session code"
              to="/join"
              color="join"
              delay={0.7}
            />
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          className="mt-10 relative z-20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <h2 className="inline-flex text-2xl font-bold text-white mb-6 items-center gap-3 px-4 py-2 rounded-xl bg-[#101427]/65 border border-purple-500/20 backdrop-blur-sm">
            <FiClock className="text-purple-400" />
            <span>Recent Activity</span>
          </h2>
          
          <div className="glass-card rounded-3xl">
            <div className="space-y-4">
              {[
                { action: 'Session started', device: 'MacBook Pro', time: '2 hours ago', status: 'completed' },
                { action: 'Device connected', device: 'Windows PC', time: '5 hours ago', status: 'completed' },
                { action: 'Session ended', device: 'Linux Server', time: 'Yesterday', status: 'completed' }
              ].map((activity, index) => (
                <motion.div
                  key={index}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.9 + index * 0.1 }}
                  whileHover={{ x: 5 }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <FiMonitor className="text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{activity.action}</p>
                      <p className="text-gray-400 text-sm">{activity.device}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-400 text-sm">{activity.time}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          className="mt-10 text-center text-gray-500 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.2 }}
        >
          <p>Let'sClone • Secure Remote Desktop Platform</p>
        </motion.div>
      </div>
    </div>
  );
}
