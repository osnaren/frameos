/** @type {import('tailwindcss').Config} */
import aspectRatio from '@tailwindcss/aspect-ratio';
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['Lato', 'sans-serif'],
        accent: ['Ubuntu', 'sans-serif'],
        decorative: ['"Tanzania Guides"', 'cursive'],
      },
    },
  },
  plugins: [aspectRatio, typography, forms],
};
