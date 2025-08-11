/** @type {import('tailwindcss').Config} */
module.exports = {
  // Tailwind v4 no longer needs 'content' in most setups; remove to avoid config parsing issues
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
    },
  },
  plugins: [],
}