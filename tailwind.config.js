/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          1: 'var(--color-primary1)',
          2: 'var(--color-primary2)',
        },
        secondary: {
          1: 'var(--color-secondary1)',
          2: 'var(--color-secondary2)',
        },
      },
    },
  },
  plugins: [],
} 