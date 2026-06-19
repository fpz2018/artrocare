/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // "Fit Worden op 61" palette — also usable via arbitrary values.
        fit: {
          primary: '#1B4332',
          accent: '#D4A574',
          secondary: '#8B7E6A',
          bg: '#F5F1EB',
          light: '#EDE8E0',
          text: '#2D3436',
        },
      },
    },
  },
  plugins: [],
};
