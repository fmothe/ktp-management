/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef3e2',
          100: '#fde4b9',
          200: '#fcd38c',
          300: '#fac15f',
          400: '#f9b340',
          500: '#f7a41f',
          600: '#f59315',
          700: '#d97706',
          800: '#b45309',
          900: '#92400e',
        },
        dark: {
          50: '#2a2d36',
          100: '#252830',
          200: '#20232a',
          300: '#1b1e24',
          400: '#16191f',
          500: '#111419',
          600: '#0d0f13',
          700: '#0a0b0e',
          800: '#070809',
          900: '#040505',
        },
        accent: {
          red: '#ef4444',
          green: '#22c55e',
          blue: '#3b82f6',
          purple: '#a855f7',
          cyan: '#06b6d4',
        }
      },
      fontFamily: {
        display: ['Rajdhani', 'sans-serif'],
        body: ['Exo 2', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'grid-pattern': `linear-gradient(rgba(249, 179, 64, 0.03) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(249, 179, 64, 0.03) 1px, transparent 1px)`,
        'radial-glow': 'radial-gradient(ellipse at center, rgba(249, 179, 64, 0.15) 0%, transparent 70%)',
      },
      backgroundSize: {
        'grid': '50px 50px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(249, 179, 64, 0.5), 0 0 10px rgba(249, 179, 64, 0.3)' },
          '100%': { boxShadow: '0 0 10px rgba(249, 179, 64, 0.8), 0 0 20px rgba(249, 179, 64, 0.5)' },
        }
      },
      boxShadow: {
        'neon': '0 0 5px rgba(249, 179, 64, 0.5), 0 0 10px rgba(249, 179, 64, 0.3), 0 0 15px rgba(249, 179, 64, 0.2)',
        'neon-strong': '0 0 10px rgba(249, 179, 64, 0.8), 0 0 20px rgba(249, 179, 64, 0.5), 0 0 30px rgba(249, 179, 64, 0.3)',
      }
    },
  },
  plugins: [],
}
