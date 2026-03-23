import type { Config } from "tailwindcss";

/**
 * Farther AX — Tailwind Config
 * Full color scales + Tremor integration.
 * Glass-morphism classes live in app/globals.css.
 */
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@tremor/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        charcoal: {
          50: '#f5f5f5',
          100: '#e0e0e0',
          200: '#bdbdbd',
          300: '#9e9e9e',
          400: '#757575',
          500: '#333333',
          600: '#2a2a2a',
          700: '#222222',
          800: '#1a1a1a',
          900: '#111111',
          DEFAULT: '#333333',
        },
        teal: {
          50: '#e8f5f7',
          100: '#b8e0e5',
          200: '#88cbd3',
          300: '#58b6c1',
          400: '#28a1af',
          500: '#2bb8c4',
          600: '#186068',
          700: '#134a4e',
          800: '#0e3434',
          900: '#091e1a',
          DEFAULT: '#2bb8c4',
        },
        ice: {
          50: '#f0f6fc',
          100: '#dce9f7',
          200: '#b6d0ed',
          300: '#90b7e3',
          400: '#6a9ed9',
          DEFAULT: '#b6d0ed',
        },
        slate: {
          DEFAULT: '#5b6a71',
        },
        // Tremor color mappings
        tremor: {
          brand: {
            faint: '#091e1a',
            muted: '#0e3434',
            subtle: '#134a4e',
            DEFAULT: '#2bb8c4',
            emphasis: '#28a1af',
            inverted: '#ffffff',
          },
          background: {
            muted: '#111111',
            subtle: '#1a1a1a',
            DEFAULT: '#222222',
            emphasis: '#ffffff',
          },
          border: { DEFAULT: 'rgba(255, 255, 255, 0.06)' },
          ring: { DEFAULT: '#2bb8c4' },
          content: {
            subtle: 'rgba(255, 255, 255, 0.3)',
            DEFAULT: 'rgba(255, 255, 255, 0.6)',
            emphasis: 'rgba(255, 255, 255, 0.9)',
            strong: '#ffffff',
            inverted: '#111111',
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
