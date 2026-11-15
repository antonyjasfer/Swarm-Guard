/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border, 215 28% 17%))',
        input: 'hsl(var(--input, 215 28% 17%))',
        ring: 'hsl(var(--ring, 224 76% 48%))',
        background: 'hsl(var(--background, 222 47% 4%))',
        foreground: 'hsl(var(--foreground, 210 40% 98%))',
        primary: {
          DEFAULT: 'hsl(var(--primary, 224 76% 48%))',
          foreground: 'hsl(var(--primary-foreground, 0 0% 100%))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary, 217 33% 12%))',
          foreground: 'hsl(var(--secondary-foreground, 210 40% 98%))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive, 0 84% 60%))',
          foreground: 'hsl(var(--destructive-foreground, 210 40% 98%))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted, 217 33% 12%))',
          foreground: 'hsl(var(--muted-foreground, 215 20% 65%))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent, 217 33% 12%))',
          foreground: 'hsl(var(--accent-foreground, 210 40% 98%))',
        },
        obsidian: {
          950: '#06070a',
          900: '#090a0f',
          850: '#0e111a',
          800: '#141824',
          700: '#1e2438',
          600: '#2b334d',
        },
        cyber: {
          emerald: '#10b981',
          crimson: '#ef4444',
          amber: '#f59e0b',
          cyan: '#06b6d4',
          violet: '#8b5cf6',
          neon: '#22d3ee',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -3px rgba(6, 182, 212, 0.25)',
        'glow-emerald': '0 0 20px -3px rgba(16, 185, 129, 0.25)',
        'glow-crimson': '0 0 20px -3px rgba(239, 68, 68, 0.3)',
        'glow-amber': '0 0 20px -3px rgba(245, 158, 11, 0.25)',
        'glow-violet': '0 0 20px -3px rgba(139, 92, 246, 0.25)',
        'glow-subtle': '0 0 24px -4px rgba(99, 102, 241, 0.12)',
        'card-light': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
      },
      animation: {
        'pulse-fast': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'shimmer-slide': 'shimmer-slide var(--speed) ease-in-out infinite alternate',
        'spin-around': 'spin-around calc(var(--speed) * 2) infinite linear',
      },
      keyframes: {
        'shimmer-slide': {
          to: {
            transform: 'translate(calc(100cqw - 100%), 0)',
          },
        },
        'spin-around': {
          '0%': { transform: 'translateZ(0) rotate(0)' },
          '15%, 35%': { transform: 'translateZ(0) rotate(90deg)' },
          '65%, 85%': { transform: 'translateZ(0) rotate(270deg)' },
          '100%': { transform: 'translateZ(0) rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
};
