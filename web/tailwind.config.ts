import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#00529B',
          dark: '#003B70',
          light: '#E8F1FA'
        }
      }
    }
  },
  plugins: []
};

export default config;
