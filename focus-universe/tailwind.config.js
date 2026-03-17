/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        focus: '#8de7ca',
        break: '#ffd799',
        surface: '#0c1320',
        mist: '#d4f9ff',
      },
      boxShadow: {
        glass: '0 20px 80px rgba(0, 0, 0, 0.35)',
      },
      animation: {
        'gentle-float': 'gentleFloat 8s ease-in-out infinite',
      },
      keyframes: {
        gentleFloat: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
}

