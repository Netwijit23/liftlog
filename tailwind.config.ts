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
        orange: {
          brand: '#FF6B00',
          deep: '#FF3B00',
        },
        canvas: '#F5F5F7',
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
      },
    },
  },
  plugins: [],
}

export default config
