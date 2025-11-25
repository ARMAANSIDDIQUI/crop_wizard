/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        'beige-50': 'rgba(245, 245, 220, 1)',
      }
    },
  },
  plugins: [],
}
