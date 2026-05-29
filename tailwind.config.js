/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pantera: {
          purple: '#AA00FF',
          pink: '#E040FB',
          dark: '#7B1FA2',
          darker: '#4A0060',
          black: '#0D0010',
          lavender: '#CE93D8',
          card: '#1a0025',
        },
        income: '#1D9E75',
        expense: '#E24B4A',
        pending: '#BA7517',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 200ms ease-out',
      },
    },
  },
  plugins: [],
}

