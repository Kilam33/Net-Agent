/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg': {
          300: '#1e181e',
          500: '#191a1e',
        },
        'primary': {
          200: '#f4908b',
          300: '#ea6f69',
          500: '#e8615a',
          600: '#9c3230',
          700: '#5e2122',
          800: '#451717',
          900: '#3c181a',
        },
        'secondary': {
          500: '#2be4ea',
          900: '#295459',
        },
        'tertiary': {
          500: '#fed33f',
        },
      },
      fontFamily: {
        'rajdhani': ['Rajdhani', 'sans-serif'],
        'vt323': ['VT323', 'monospace'],
      },
      boxShadow: {
        'glow': '0 0 5px var(--colors-primary-500)',
        'glow-borders': '0 0 3px var(--colors-primary-500)',
      },
      textShadow: {
        'glow': '-9px -6px 40px currentColor',
        'glow-dimmed': '-9px -6px 40px currentColor',
      },
      clipPath: {
        'notch': 'polygon(0 0, 100% 0, 100% calc(100% - 1rem + 2px), calc(100% - 1rem + 2px) 100%, 0 100%)',
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        '.text-shadow-glow': {
          'text-shadow': 'var(--tw-text-shadow-glow)',
        },
        '.text-shadow-glow-dimmed': {
          'text-shadow': 'var(--tw-text-shadow-glow-dimmed)',
        },
      };
      addUtilities(newUtilities);
    },
  ],
} 