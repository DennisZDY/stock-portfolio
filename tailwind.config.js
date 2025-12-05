/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",       // Only scan files in the root (like App.tsx)
    "./components/**/*.{js,ts,jsx,tsx}", // Scan all files in components folder
  ],
  theme: {
    extend: {
      colors: {
        'stock-up': '#ef4444',
        'stock-down': '#10b981',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
