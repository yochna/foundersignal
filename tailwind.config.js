/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-theme="glacier"]'],
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './lib/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Channel-triplet CSS vars so opacity modifiers (bg-primary/10) compose.
        background: 'rgb(var(--bg-background) / <alpha-value>)',
        surface: 'rgb(var(--bg-surface) / <alpha-value>)',
        'surface-container': 'rgb(var(--bg-surface-container) / <alpha-value>)',
        'surface-low': 'rgb(var(--bg-surface-low) / <alpha-value>)',
        'surface-high': 'rgb(var(--bg-surface-high) / <alpha-value>)',
        'on-surface': 'rgb(var(--text-on-surface) / <alpha-value>)',
        'on-surface-variant': 'rgb(var(--text-on-surface-variant) / <alpha-value>)',
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        'on-primary': 'rgb(var(--color-on-primary) / <alpha-value>)',
        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        tertiary: 'rgb(var(--color-tertiary) / <alpha-value>)',
        border: 'rgb(var(--border-color) / <alpha-value>)',
        ring: 'rgb(var(--color-primary) / <alpha-value>)',
        'emerald-signal': '#10b981',
        'violet-signal': '#8b5cf6',
        'indigo-signal': '#6366f1',
        'amber-signal': '#f59e0b',
        'rose-signal': '#f43f5e',
        'sky-signal': '#0ea5e9',
      },
      borderRadius: {
        DEFAULT: 'var(--radius-default)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'calc(var(--radius-xl) + 0.5rem)',
      },
      fontFamily: {
        headline: 'var(--font-headline)',
        body: 'var(--font-body)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-ring': {
          '0%, 100%': { opacity: '0.35' },
          '50%': { opacity: '0.75' },
        },
        'slide-down': {
          '0%': { height: '0', opacity: '0' },
          '100%': { height: 'var(--radix-collapsible-content-height)', opacity: '1' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        /* Indeterminate progress: a short bar sliding the full track. */
        sweep: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(320%)' },
        },
        /* Slow gradient drift for the AI "thinking" surfaces. */
        aurora: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'bounce-dot': {
          '0%, 80%, 100%': { transform: 'translateY(0)', opacity: '0.45' },
          '40%': { transform: 'translateY(-4px)', opacity: '1' },
        },
        'ring-expand': {
          '0%': { transform: 'scale(0.85)', opacity: '0.6' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        'slide-up-fade': {
          '0%': { opacity: '0', transform: 'translateY(14px) scale(0.985)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
        'fade-up': 'fade-up 0.35s ease-out both',
        'scale-in': 'scale-in 0.2s ease-out both',
        'pulse-ring': 'pulse-ring 3s ease-in-out infinite',
        orbit: 'orbit 3.4s linear infinite',
        'orbit-slow': 'orbit 7s linear infinite',
        float: 'float 3.6s ease-in-out infinite',
        sweep: 'sweep 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        aurora: 'aurora 6s ease-in-out infinite',
        'bounce-dot': 'bounce-dot 1.2s ease-in-out infinite',
        'ring-expand': 'ring-expand 2.4s cubic-bezier(0.22, 1, 0.36, 1) infinite',
        'slide-up-fade': 'slide-up-fade 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
