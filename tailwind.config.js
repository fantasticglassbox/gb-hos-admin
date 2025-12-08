/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e0fbfc',
          100: '#bbf4f6',
          200: '#8ee9ee',
          300: '#55d9e1',
          400: '#21c1cd',
          500: '#00a5b2',
          600: '#008491', // Base brand colorish
          700: '#006a76',
          800: '#00545e',
          900: '#00464f',
          950: '#002d34',
          DEFAULT: '#00C2CB', // The requested Glassbox Cyan
        }
      }
    },
  },
  plugins: [],
}
