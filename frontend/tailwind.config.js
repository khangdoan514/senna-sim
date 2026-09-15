import plugin from 'tailwindcss/plugin'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  safelist: [
    'tire-texture', 'tire-texture-dark',
    'diag-stripes', 'diag-stripes-heavy', 'diag-stripes-team', 'diag-stripes-animated',
    'carbon-hex', 'dot-grid', 'scan-lines',
    'steel-shimmer', 'glow-pulse',
    'animate-slide-up', 'animate-slide-right', 'animate-slide-left',
    'animate-slide-down', 'animate-zoom-in', 'animate-flash-red',
    'animate-card-rise', 'animate-lap-slide-in', 'animate-shimmer',
  ],
  theme: {
    extend: {
      fontFamily: {
        'zen-dots':           ['"Zen Dots"',               'sans-serif'],
        'alumni-sans':        ['"Alumni Sans"',            'sans-serif'],
        'alumni-sans-inline': ['"Alumni Sans Inline One"', 'sans-serif'],
      },
      colors: {
        'f1-red':     '#D82B0D',
        'f1-steel':   '#7C989E',
        'f1-slate':   '#748386',
        'f1-egg':     '#F0EBD8',
        'f1-lav':     '#9FA0C3',
        'f1-deep':    '#080a0b',
        'f1-base':    '#0c0e10',
        'f1-panel':   '#111416',
        'f1-card':    '#161a1d',
        'f1-surface': '#1c2124',
      },
      animation: {
        'lap-slide-in': 'lap-slide-in 0.3s ease both',
        'card-rise':    'card-rise 0.4s ease both',
        'glow-pulse':   'pulse-glow 2s ease-in-out infinite',
        'shimmer':      'shimmer 2.4s linear infinite',
        'slide-up':    'slide-up    0.4s cubic-bezier(0.16,1,0.3,1) both',
        'slide-right': 'slide-right 0.35s cubic-bezier(0.16,1,0.3,1) both',
        'slide-left':  'slide-left  0.35s cubic-bezier(0.16,1,0.3,1) both',
        'slide-down':  'slide-down  0.3s cubic-bezier(0.16,1,0.3,1) both',
        'zoom-in':     'zoom-in     0.3s cubic-bezier(0.16,1,0.3,1) both',
        'flash-red':   'flash-red   0.5s cubic-bezier(0.16,1,0.3,1) both',
        'stripe-slide':'stripe-slide 18s linear infinite',
      },
      keyframes: {
        'lap-slide-in': {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to:   { opacity: '1', transform: 'translateY(0)'    },
        },
        'card-rise': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)'    },
        },
        'pulse-glow': {
          '0%,100%': { boxShadow: '0 0 4px #D82B0D, 0 0 8px rgba(216,43,13,0.35)' },
          '50%':     { boxShadow: '0 0 10px #D82B0D, 0 0 24px rgba(216,43,13,0.35)' },
        },
        'shimmer': {
          from: { backgroundPosition: '-200% center' },
          to:   { backgroundPosition:  '200% center' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(48px)' },
          to:   { opacity: '1', transform: 'translateY(0)'    },
        },
        'slide-right': {
          from: { opacity: '0', transform: 'translateX(-64px)' },
          to:   { opacity: '1', transform: 'translateX(0)'     },
        },
        'slide-left': {
          from: { opacity: '0', transform: 'translateX(64px)' },
          to:   { opacity: '1', transform: 'translateX(0)'    },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-24px)' },
          to:   { opacity: '1', transform: 'translateY(0)'     },
        },
        'zoom-in': {
          from: { opacity: '0', transform: 'scale(0.88)' },
          to:   { opacity: '1', transform: 'scale(1)'    },
        },
        'flash-red': {
          '0%':   { opacity: '0', filter: 'brightness(2) saturate(2)' },
          '40%':  { opacity: '1', filter: 'brightness(1.4)' },
          '100%': { opacity: '1', filter: 'brightness(1)'  },
        },
        'stripe-slide': {
          from: { backgroundPosition: '0 0' },
          to:   { backgroundPosition: '80px 0' },
        },
      },
      animationDelay: {
        '75':  '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '400': '400ms',
        '500': '500ms',
        '600': '600ms',
        '700': '700ms',
        '800': '800ms',
      },
    },
  },
  plugins: [
    plugin(function ({ matchUtilities, theme }) {
      matchUtilities(
        { delay: (value) => ({ animationDelay: value }) },
        { values: theme('animationDelay') }
      )
    }),
    plugin(function ({ addUtilities }) {
      addUtilities({
        '.tire-texture': {
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect x='2' y='2' width='14' height='7' rx='1.5' fill='white' opacity='0.055'/%3E%3Crect x='26' y='2' width='14' height='7' rx='1.5' fill='white' opacity='0.055'/%3E%3Crect x='2' y='14' width='14' height='7' rx='1.5' fill='white' opacity='0.035'/%3E%3Crect x='26' y='14' width='14' height='7' rx='1.5' fill='white' opacity='0.035'/%3E%3Crect x='2' y='26' width='14' height='7' rx='1.5' fill='white' opacity='0.055'/%3E%3Crect x='26' y='26' width='14' height='7' rx='1.5' fill='white' opacity='0.055'/%3E%3Crect x='2' y='38' width='14' height='7' rx='1.5' fill='white' opacity='0.035'/%3E%3Crect x='26' y='38' width='14' height='7' rx='1.5' fill='white' opacity='0.035'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        },
        '.tire-texture-dark': {
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect x='2' y='2' width='14' height='7' rx='1.5' fill='white' opacity='0.025'/%3E%3Crect x='26' y='2' width='14' height='7' rx='1.5' fill='white' opacity='0.025'/%3E%3Crect x='2' y='14' width='14' height='7' rx='1.5' fill='white' opacity='0.015'/%3E%3Crect x='26' y='14' width='14' height='7' rx='1.5' fill='white' opacity='0.015'/%3E%3Crect x='2' y='26' width='14' height='7' rx='1.5' fill='white' opacity='0.025'/%3E%3Crect x='26' y='26' width='14' height='7' rx='1.5' fill='white' opacity='0.025'/%3E%3Crect x='2' y='38' width='14' height='7' rx='1.5' fill='white' opacity='0.015'/%3E%3Crect x='26' y='38' width='14' height='7' rx='1.5' fill='white' opacity='0.015'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        },
        '.diag-stripes': {
          backgroundImage: 'repeating-linear-gradient(-52deg,transparent 0px,transparent 8px,rgba(255,255,255,0.022) 8px,rgba(255,255,255,0.022) 9px)',
        },
        '.diag-stripes-heavy': {
          backgroundImage: 'repeating-linear-gradient(-52deg,transparent 0px,transparent 6px,rgba(255,255,255,0.04) 6px,rgba(255,255,255,0.04) 7px)',
        },
        '.diag-stripes-team': {
          backgroundImage: 'repeating-linear-gradient(-52deg,transparent 0px,transparent 10px,rgba(0,0,0,0.12) 10px,rgba(0,0,0,0.12) 11px)',
        },
        '.diag-stripes-animated': {
          backgroundImage: 'repeating-linear-gradient(-52deg,transparent 0px,transparent 36px,rgba(216,43,13,0.06) 36px,rgba(216,43,13,0.06) 40px)',
          backgroundSize: '80px 80px',
          animationName: 'stripe-slide',
          animationDuration: '18s',
          animationTimingFunction: 'linear',
          animationIterationCount: 'infinite',
        },
        '.carbon-hex': {
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='32'%3E%3Cpolygon points='14,1 26,8 26,22 14,29 2,22 2,8' fill='none' stroke='rgba(255,255,255,0.017)' stroke-width='0.8'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        },
        '.dot-grid': {
          backgroundImage: 'radial-gradient(circle, rgba(124,152,158,0.18) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        },
        '.scan-lines': {
          backgroundImage: 'repeating-linear-gradient(0deg,transparent 0px,transparent 3px,rgba(124,152,158,0.04) 3px,rgba(124,152,158,0.04) 4px)',
        },
        '.steel-shimmer': {
          background: 'linear-gradient(90deg, transparent 0%, rgba(124,152,158,0.12) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
          animationName: 'shimmer',
          animationDuration: '2.4s',
          animationTimingFunction: 'linear',
          animationIterationCount: 'infinite',
        },
        '.glow-pulse': {
          animationName: 'pulse-glow',
          animationDuration: '2s',
          animationTimingFunction: 'ease-in-out',
          animationIterationCount: 'infinite',
        },
      })
    }),
  ],
}
