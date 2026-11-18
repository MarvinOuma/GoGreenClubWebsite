/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forest: '#123b2a',
        leaf: '#216c47',
        lime: { accent: '#b8dc78' },
        ivory: '#f6f8f2',
        ink: '#172721',
        muted: '#53645a',
        line: '#dbe4d7',
        success: '#216c47',
        warning: '#8a530e',
        danger: '#a22735',
        focus: '#248451',
        'brand-green': '#216c47',
        'brand-light': '#b8dc78',
      },
      fontFamily: {
        sans: ['Inter Variable', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Instrument Sans Variable', 'Inter Variable', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
