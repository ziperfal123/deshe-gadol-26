/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Kibbutz / easy-going Israeli palette
        sand: '#F6F0E2', // warm cream background
        clay: '#E07A5F', // terracotta accent
        sage: '#81B29A', // soft field green
        leaf: '#3D8361', // deeper green
        sun: '#F2CC8F', // sunny yellow
        sky: '#6FB3D9', // turquoise sky
        ink: '#3D405B', // deep slate text
      },
      fontFamily: {
        sans: ['Heebo', 'Assistant', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 6px 20px -8px rgba(61, 64, 91, 0.25)',
        header: '0 10px 24px -16px rgba(61, 64, 91, 0.5)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'pop-in': {
          from: { opacity: '0', transform: 'translateY(10px) scale(0.96)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out',
        'pop-in': 'pop-in 260ms cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}

