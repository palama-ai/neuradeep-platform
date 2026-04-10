/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7ff',
          100: '#ebf0fe',
          200: '#ced9fd',
          300: '#b1c2fb',
          400: '#7695f8',
          500: '#3b68f5',
          600: '#355ddd',
          700: '#2c4db8',
        },
        surface: 'var(--surface)',
        'surface-hover': 'var(--surface-hover)',
        sidebar: 'var(--sidebar-bg)',
        'text-primary': 'var(--text)',
        'text-secondary': 'var(--text-secondary)',
        border: 'var(--border)'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      }
    },
  },
  plugins: [],
}
