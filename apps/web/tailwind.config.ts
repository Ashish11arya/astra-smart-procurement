import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'var(--font-inter)',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'sans-serif',
        ],
      },
      fontSize: {
        'xs': ['12px', { lineHeight: '1.5' }],
        'sm': ['14px', { lineHeight: '1.5' }],
        'base': ['17px', { lineHeight: '1.6' }],
        'lg': ['18px', { lineHeight: '1.4' }],
        'xl': ['20px', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        '2xl': ['24px', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        '3xl': ['30px', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        '4xl': ['32px', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'hero': ['clamp(42px, 5vw, 64px)', { lineHeight: '1.1', letterSpacing: '-0.025em' }]
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        emerald: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
      },
    },
  },
  plugins: [],
};

export default config;
