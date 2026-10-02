/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ig: {
          pink: '#E1306C',
          purple: '#C13584',
          orange: '#F56040',
          yellow: '#FCAF45',
          blue: '#405DE6',
          dark: '#0F172A',
          card: '#1E293B',
          cardHover: '#334155'
        }
      },
      backgroundImage: {
        'ig-gradient': 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
        'ig-subtle': 'linear-gradient(135deg, rgba(240, 148, 51, 0.1) 0%, rgba(220, 39, 67, 0.1) 50%, rgba(188, 24, 136, 0.1) 100%)',
      }
    },
  },
  plugins: [],
}
