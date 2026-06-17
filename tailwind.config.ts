import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#FDF2F8',
        blush: {
          50: '#FDF2F8',
          100: '#FCE7F3',
          200: '#FBCFE8',
        },
        gold: {
          100: '#FEF9C3',
          200: '#FDE68A',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
        },
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display',
          'system-ui', 'sans-serif',
        ],
        serif: ['Georgia', 'Times New Roman', 'serif'],
      },
      boxShadow: {
        'pink-sm': '0 2px 16px rgba(236, 72, 153, 0.08)',
        'pink-md': '0 8px 32px rgba(236, 72, 153, 0.25)',
        'pink-lg': '0 12px 40px rgba(219, 39, 119, 0.35)',
        'gold-sm': '0 2px 12px rgba(245, 158, 11, 0.25)',
        'gold-md': '0 6px 24px rgba(245, 158, 11, 0.35)',
      },
    },
  },
  plugins: [],
}

export default config
