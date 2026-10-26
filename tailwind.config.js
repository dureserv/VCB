export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          50: '#eaf6ff',
          100: '#d7efff',
          200: '#b7e1ff',
          300: '#7fc7ff',
          400: '#4caaf9',
          500: '#248ff4',
          600: '#1672d9',
          700: '#175bb0',
          800: '#184d8b',
          900: '#1a426f'
        }
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(59,130,246,0.2), 0 10px 30px rgba(15,23,42,0.7)'
      }
    }
  },
  plugins: []
}
