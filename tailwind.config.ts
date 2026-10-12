import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        midnight: '#080E16', charcoal: '#0B0D10', slate: { DEFAULT: '#172433' }, gold: '#D8BD8A',
        ivory: '#F4F0E8', silver: '#A8B2C0', amber: '#E8923A',
      },
      fontFamily: { display: ['var(--font-display)', 'Georgia', 'serif'], sans: ['var(--font-sans)', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
export default config;
