/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fbf6e6',
          100: '#f6ecc8',
          200: '#eeda8e',
          300: '#e9c97b',
          400: '#d4af37',
          500: '#c69a2e',
          600: '#a8851f',
          700: '#876614',
          800: '#5e470d',
          900: '#3a2c08',
        },
        orange: {
          400: '#ff9a3c',
          500: '#ff7a00',
          600: '#e66a00',
        },
        ink: {
          900: '#0a0a0a',
          800: '#0f0f0f',
          700: '#161616',
          600: '#1c1c1c',
          500: '#232323',
          400: '#2e2e2e',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        gold: '0 8px 32px -8px rgba(212, 175, 55, 0.4)',
        'gold-lg': '0 20px 60px -12px rgba(212, 175, 55, 0.35)',
        card: '0 12px 40px -16px rgba(0, 0, 0, 0.8)',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #e9c97b 0%, #d4af37 50%, #c69a2e 100%)',
        'gold-radial':
          'radial-gradient(ellipse at top, rgba(212,175,55,0.12), transparent 60%)',
        'hero-overlay':
          'linear-gradient(to top, rgba(15,15,15,0.95) 0%, rgba(15,15,15,0.6) 40%, rgba(15,15,15,0.2) 100%)',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fadeIn 0.5s ease-out both',
        'scale-in': 'scaleIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
