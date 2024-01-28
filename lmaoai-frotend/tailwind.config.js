/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      minHeight: {
        'rmnav': 'calc(100vh - 16rem)',
      }
    },
  },
  plugins: [],
}

