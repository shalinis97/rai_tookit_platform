/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
        'space-mono': ['Space Mono', 'monospace'],
      },
      colors: {
        bg: '#080c10',
        surface: '#0d1117',
        surface2: '#161b22',
        surface3: '#1c2430',
        border: '#21262d',
        border2: '#30363d',
        text: {
          DEFAULT: '#e6edf3',
          2: '#8b949e',
          3: '#484f58',
        },
        accent: {
          DEFAULT: '#00ff88',
          2: '#00cc6e',
        },
        agent: {
          DEFAULT: '#7c3aed',
          light: '#a855f7',
        },
        fn: {
          DEFAULT: '#0ea5e9',
          light: '#38bdf8',
        },
        output: {
          DEFAULT: '#f59e0b',
          light: '#fbbf24',
        },
        trigger: {
          DEFAULT: '#ef4444',
          light: '#f87171',
        },
        condition: {
          DEFAULT: '#10b981',
          light: '#34d399',
        },
      },
      animation: {
        pulse: 'pulse 2s ease-in-out infinite',
        dash: 'dash 1.5s linear infinite',
        'toast-in': 'toastIn 0.2s ease',
        'slide-up': 'slideUp 0.2s ease',
        'fade-in': 'fadeIn 0.15s ease',
      },
      keyframes: {
        pulse: {
          '0%, 100%': { opacity: 1, boxShadow: '0 0 12px #00ff88' },
          '50%': { opacity: 0.6, boxShadow: '0 0 4px #00ff88' },
        },
        dash: { to: { strokeDashoffset: '-12' } },
        toastIn: {
          from: { transform: 'translateX(20px)', opacity: 0 },
          to: { transform: 'translateX(0)', opacity: 1 },
        },
        slideUp: {
          from: { transform: 'translateY(12px)', opacity: 0 },
          to: { transform: 'translateY(0)', opacity: 1 },
        },
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};
