/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0b0f19',
          50: '#1a1f2e',
          100: '#151a27',
          200: '#111622',
          300: '#0d111c',
          400: '#0b0f19',
          500: '#080c14',
          600: '#060910',
          700: '#04060b',
          800: '#020307',
          900: '#000102',
        },
        accent: {
          DEFAULT: '#00e5ff',
          50: '#e0fcff',
          100: '#b3f5ff',
          200: '#80edff',
          300: '#4de6ff',
          400: '#1adfff',
          500: '#00e5ff',
          600: '#00b8cc',
          700: '#008a99',
          800: '#005c66',
          900: '#002e33',
        },
        neon: {
          purple: '#7c3aed',
          pink: '#ec4899',
          green: '#22c55e',
          orange: '#f97316',
          red: '#ff3b3b',
        },
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'glow': 'glow-pulse 2s ease-in-out infinite alternate',
        'grid-move': 'gridMove 20s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'border-glow': 'borderGlow 3s ease-in-out infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%': { boxShadow: '0 0 5px rgba(0,229,255,0.2), 0 0 20px rgba(0,229,255,0.1)' },
          '100%': { boxShadow: '0 0 10px rgba(0,229,255,0.4), 0 0 40px rgba(0,229,255,0.2)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'borderGlow': {
          '0%, 100%': { borderColor: 'rgba(0,229,255,0.2)' },
          '50%': { borderColor: 'rgba(0,229,255,0.5)' },
        },
      },
      boxShadow: {
        'neon': '0 0 5px rgba(0,229,255,0.3), 0 0 20px rgba(0,229,255,0.15)',
        'neon-lg': '0 0 10px rgba(0,229,255,0.4), 0 0 40px rgba(0,229,255,0.2), 0 0 80px rgba(0,229,255,0.1)',
        'neon-purple': '0 0 5px rgba(124,58,237,0.3), 0 0 20px rgba(124,58,237,0.15)',
        'glass': '0 8px 32px rgba(0,0,0,0.4)',
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
}
