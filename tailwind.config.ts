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
          50: '#f0f4f6',
          100: '#d4dfe5',
          200: '#99b6c3',
          300: '#a8ced3',
          400: '#99B6C3',
          500: '#4E7082',
          600: '#374E59',
          700: '#405B69',
          800: '#2d3e47',
          900: '#1a2830',
          DEFAULT: '#4E7082',
        },
        ice: {
          50: '#f0f6fc',
          100: '#dce9f7',
          200: '#A8CED3',
          300: '#99B6C3',
          400: '#6a9ed9',
          DEFAULT: '#D4DFE5',
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
            DEFAULT: '#4E7082',
            emphasis: '#374E59',
            inverted: '#ffffff',
          },
          background: {
            muted: '#111111',
            subtle: '#1a1a1a',
            DEFAULT: '#222222',
            emphasis: '#ffffff',
          },
          border: { DEFAULT: 'rgba(255, 255, 255, 0.06)' },
          ring: { DEFAULT: '#4E7082' },
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
