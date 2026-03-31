import type { Config } from "tailwindcss";

/**
 * Farther AX — Tailwind Config with Farther Brand Colors
 *
 * Colors are defined here to work with Tailwind utility classes (bg-*, text-*, border-*)
 * while maintaining compatibility with the THEME object in lib/theme.ts
 */
const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@tremor/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // === Farther Brand Palette ===

        // Clay (warm sand/tan — brand anchor)
        clay: {
          25: '#FAFAFA',
          50: '#F5F4F1',
          100: '#E6E3DB',
          200: '#CFC8B9',
          300: '#B3A791',
          400: '#9F8E75',
          500: '#8E7B64',
          600: '#7A6654',
          700: '#625146',
          800: '#55453E',
          900: '#4A3E39',
        },

        // Limestone (warm cream)
        limestone: {
          50: '#F8F4F0',
          100: '#F2EAE2',
          200: '#E3D3C5',
          300: '#D1B6A0',
          400: '#BE9479',
          500: '#B17B5E',
        },

        // Steel Blue (cool structure)
        'steel-blue': {
          25: '#FBFDFF',
          50: '#F5F8FA',
          100: '#EBF0F3',
          200: '#D2DFE5',
          300: '#94B5C3',
          400: '#7CA4B4',
          500: '#5B8A9C',
          600: '#476F82',
          700: '#3B5A69',
          800: '#334D59',
          900: '#2F424B',
        },

        // Slate Blue
        'slate-blue': {
          200: '#CCD2D5',
          400: '#7C8D94',
          500: '#5B6A71',
        },

        // Charcoal
        charcoal: {
          100: '#E7E7E7',
          200: '#D1D1D1',
          500: '#6D6D6D',
          600: '#4F4F4F',
          700: '#4F4F4F',
          900: '#333333',
        },

        // Serene Aqua (accent)
        'serene-aqua': {
          400: '#5DCCDB',
          600: '#289FAF',
          700: '#1D7682',
        },

        // === Semantic Color Aliases ===
        // These adapt to light/dark mode via CSS variables

        // Primary brand colors
        teal: {
          DEFAULT: '#3B5A69',  // steel-blue-700
          light: '#94B5C3',     // steel-blue-300
          dark: '#2F424B',      // steel-blue-900
          glow: 'rgba(59, 90, 105, 0.18)',
        },

        // Contextual colors (mode-aware via CSS variables)
        cream: {
          DEFAULT: 'var(--color-text)',      // Text color: charcoal in light, cream in dark
          bg: 'var(--color-bg)',             // Background: cream in light, dark in dark
          border: 'var(--color-border)',     // Border: mode-aware
        },

        // Text colors (mode-aware)
        slate: {
          DEFAULT: 'var(--color-text-secondary)',  // Secondary text color
          200: '#CCD2D5',      // slate-blue-200
          400: '#7C8D94',      // slate-blue-400
          500: '#5B6A71',      // slate-blue-500
        },

        // Support colors
        ivory: '#F8F4F0',      // limestone-50
        linen: '#F5F4F1',      // clay-50
        mist: '#D2DFE5',       // steel-blue-200
        sky: '#94B5C3',        // steel-blue-300
        aqua: '#5DCCDB',       // serene-aqua-400
        terra: '#9F8E75',      // clay-400
        steel: '#3B5A69',      // steel-blue-700
        graphite: '#2F424B',   // steel-blue-900
        bronze: '#B68A4C',
        pomegranate: '#CE3657',

        // Gold/Bronze brand accent
        gold: {
          DEFAULT: '#B68A4C',
          dark: '#9A7440',      // Darker variant for light mode
          light: '#C99B5F',     // Lighter variant for dark mode
        },

        // Additional contextual colors
        'cream-bg': 'var(--color-bg)',
        'cream-border': 'var(--color-border)',

        // Status colors
        success: '#6DBF7B',
        warning: '#C49A5C',
        error: '#D4736E',
        danger: '#D4736E',
        neutral: '#B0ACA4',
        info: '#7CA4B4',
      },

      fontFamily: {
        serif: ["'ABC Arizona Text'", 'Georgia', 'serif'],
        sans: ["'Fakt'", "'Inter'", 'Arial', 'sans-serif'],
        mono: ["'Fakt Mono'", "'DM Mono'", "'Courier New'", 'monospace'],
      },

      fontSize: {
        xs: '11px',
        sm: '13px',
        base: '15px',
        md: '16px',
        lg: '18px',
        xl: '22px',
        '2xl': '28px',
        '3xl': '36px',
        '4xl': '48px',
      },

      spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        // NOTE: Do NOT use 2xl/3xl/4xl/5xl/6xl/7xl keys here — they collide
        // with Tailwind v4's max-width scale (max-w-3xl, max-w-4xl, etc.)
        // causing containers to shrink to pixel values instead of rem values.
        // Use THEME.spacing in inline styles for these larger values instead.
      },

      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
      },

      boxShadow: {
        sm: '0 1px 2px rgba(59, 90, 105, 0.08)',
        DEFAULT: '0 4px 8px rgba(59, 90, 105, 0.06), 0 1px 2px rgba(59, 90, 105, 0.04)',
        md: '0 4px 8px rgba(59, 90, 105, 0.06), 0 1px 2px rgba(59, 90, 105, 0.04)',
        lg: '0 12px 24px rgba(59, 90, 105, 0.08), 0 4px 8px rgba(59, 90, 105, 0.05)',
        xl: '0 16px 32px rgba(0, 0, 0, 0.10), 0 8px 16px rgba(0, 0, 0, 0.06)',
        'glow-steel': '0 0 20px rgba(59, 90, 105, 0.35)',
        'glow-accent': '0 0 18px rgba(93, 204, 219, 0.40)',
      },
    },
  },
  plugins: [],
};

export default config;
