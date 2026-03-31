/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        accent: {
          DEFAULT: '#3b82f6',
          soft: 'rgba(59,130,246,0.12)',
          glow: 'rgba(59,130,246,0.25)',
        },
        urgent: {
          DEFAULT: '#ef4444',
          soft: 'rgba(239,68,68,0.12)',
        },
        waiting: {
          DEFAULT: '#f59e0b',
          soft: 'rgba(245,158,11,0.12)',
        },
        done: {
          DEFAULT: '#22c55e',
          soft: 'rgba(34,197,94,0.12)',
        },
        etudes: '#6366f1',
        encours: '#f59e0b',
        realise: '#22c55e',
        archive: '#475569',
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      spacing: {
        18: '4.5rem',
      },
      boxShadow: {
        card: '0 4px 24px rgba(0,0,0,0.35)',
        glow: '0 0 0 1px #3b82f6, 0 4px 24px rgba(59,130,246,0.25)',
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '18px',
      },
    },
  },
  plugins: [],
};
