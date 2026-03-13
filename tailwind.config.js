/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        brutal: '4px 4px 0 0 rgba(15, 23, 42, 0.9)',
        'brutal-success': '4px 4px 0 0 rgba(22, 101, 52, 0.9)',
        'brutal-glow': '0 0 0 2px rgba(255, 92, 27, 0.35), 6px 6px 0 0 rgba(255, 122, 60, 0.35)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        'safety-orange': {
          DEFAULT: '#FF5C1B',
          ink: '#1F1308',
          glow: '#FF7A3C',
        },
      },
      borderWidth: {
        brutal: '2px',
      },
    },
  },
  plugins: [],
}
