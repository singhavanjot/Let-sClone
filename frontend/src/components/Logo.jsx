/**
 * Logo Component
 * Let'sClone branding logo
 */

function Logo({ size = 'md', showText = true, className = '' }) {
  const sizes = {
    sm: { icon: 'w-6 h-6', text: 'text-lg' },
    md: { icon: 'w-8 h-8', text: 'text-xl' },
    lg: { icon: 'w-12 h-12', text: 'text-2xl' },
    xl: { icon: 'w-16 h-16', text: 'text-3xl' }
  };

  const { icon, text } = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Logo Icon */}
      <div className={`${icon} relative`}>
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Gradients */}
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6"/>
              <stop offset="100%" stopColor="#8b5cf6"/>
            </linearGradient>
            <linearGradient id="screenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e3a8a"/>
              <stop offset="100%" stopColor="#312e81"/>
            </linearGradient>
          </defs>
          
          {/* Outer Circle */}
          <circle cx="100" cy="100" r="95" fill="url(#logoGradient)" fillOpacity="0.15"/>
          <circle cx="100" cy="100" r="95" stroke="url(#logoGradient)" strokeWidth="6" fill="none"/>
          
          {/* Monitor */}
          <rect x="45" y="45" width="110" height="80" rx="8" fill="url(#screenGrad)" stroke="url(#logoGradient)" strokeWidth="4"/>
          
          {/* Screen */}
          <rect x="52" y="52" width="96" height="66" rx="4" fill="#0f172a"/>
          
          {/* Connection Wave */}
          <path d="M70 75 L85 90 L100 70 L115 95 L130 80" stroke="#3b82f6" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          
          {/* Connection Dots */}
          <circle cx="70" cy="75" r="6" fill="#22c55e"/>
          <circle cx="130" cy="80" r="6" fill="#22c55e"/>
          
          {/* Stand */}
          <rect x="90" y="125" width="20" height="15" fill="url(#logoGradient)"/>
          <rect x="75" y="140" width="50" height="8" rx="4" fill="url(#logoGradient)"/>
          
          {/* Side Arrows */}
          <path d="M30 100 L20 90 M20 90 L20 110 M20 90 L30 90" stroke="#8b5cf6" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          <path d="M170 100 L180 90 M180 90 L180 110 M180 90 L170 90" stroke="#8b5cf6" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </svg>
      </div>
      
      {/* Text */}
      {showText && (
        <span className={`${text} font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent`}>
          Let'sClone
        </span>
      )}
    </div>
  );
}

export default Logo;
