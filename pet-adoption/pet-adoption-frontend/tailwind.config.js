/** @type {import('tailwindcss').Config} */
import daisyui from "daisyui"

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation: {
        fadeInAndMove: 'fadeInAndMove 4s ease-in-out forwards',
      },
      keyframes: {
        fadeInAndMove: {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '50%': { opacity: 0.5, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [daisyui],
};
