import type { Config } from "tailwindcss";

/**
 * Farther AX — Tailwind Config (Semantic Tokens)
 * Semantic color system with Cream & Teal brand colors
 * Legacy colors maintained for backward compatibility
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
        // ── SEMANTIC TOKENS (Primary System) ──────────────────────────
        brand: {
          50: 'var(--color-brand-50)',
          100: 'var(--color-brand-100)',
          200: 'var(--color-brand-200)',
          300: 'var(--color-brand-300)',
          400: 'var(--color-brand-400)',
          500: 'var(--color-brand-500)',
          600: 'var(--color-brand-600)',
          700: 'var(--color-brand-700)',
          800: 'var(--color-brand-800)',
          900: 'var(--color-brand-900)',
          DEFAULT: 'var(--color-brand-500)',
        },
        surface: {
          DEFAULT: 'var(--color-surface)',
          muted: 'var(--color-surface-muted)',
          subtle: 'var(--color-surface-subtle)',
          elevated: 'var(--color-surface-elevated)',
          inverse: 'var(--color-surface-inverse)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          subtle: 'var(--color-text-subtle)',
          inverse: 'var(--color-text-inverse)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          subtle: 'var(--color-border-subtle)',
          strong: 'var(--color-border-strong)',
        },
        success: {
          50: 'var(--color-success-50)',
          100: 'var(--color-success-100)',
          200: 'var(--color-success-200)',
          300: 'var(--color-success-300)',
          400: 'var(--color-success-400)',
          500: 'var(--color-success-500)',
          600: 'var(--color-success-600)',
          700: 'var(--color-success-700)',
          800: 'var(--color-success-800)',
          900: 'var(--color-success-900)',
          DEFAULT: 'var(--color-success-400)',
        },
        warning: {
          50: 'var(--color-warning-50)',
          100: 'var(--color-warning-100)',
          200: 'var(--color-warning-200)',
          300: 'var(--color-warning-300)',
          400: 'var(--color-warning-400)',
          500: 'var(--color-warning-500)',
          600: 'var(--color-warning-600)',
          700: 'var(--color-warning-700)',
          800: 'var(--color-warning-800)',
          900: 'var(--color-warning-900)',
          DEFAULT: 'var(--color-warning-400)',
        },
        error: {
          50: 'var(--color-error-50)',
          100: 'var(--color-error-100)',
          200: 'var(--color-error-200)',
          300: 'var(--color-error-300)',
          400: 'var(--color-error-400)',
          500: 'var(--color-error-500)',
          600: 'var(--color-error-600)',
          700: 'var(--color-error-700)',
          800: 'var(--color-error-800)',
          900: 'var(--color-error-900)',
          DEFAULT: 'var(--color-error-400)',
        },
        info: {
          50: 'var(--color-info-50)',
          100: 'var(--color-info-100)',
          200: 'var(--color-info-200)',
          300: 'var(--color-info-300)',
          400: 'var(--color-info-400)',
          500: 'var(--color-info-500)',
          600: 'var(--color-info-600)',
          700: 'var(--color-info-700)',
          800: 'var(--color-info-800)',
          900: 'var(--color-info-900)',
          DEFAULT: 'var(--color-info-400)',
        },
        neutral: {
          50: 'var(--color-neutral-50)',
          100: 'var(--color-neutral-100)',
          200: 'var(--color-neutral-200)',
          300: 'var(--color-neutral-300)',
          400: 'var(--color-neutral-400)',
          500: 'var(--color-neutral-500)',
          600: 'var(--color-neutral-600)',
          700: 'var(--color-neutral-700)',
          800: 'var(--color-neutral-800)',
          900: 'var(--color-neutral-900)',
          DEFAULT: 'var(--color-neutral-500)',
        },
        accent: {
          1: 'var(--color-accent-1)',  // Terracotta/brown
          2: 'var(--color-accent-2)',  // Light blue/grey
          3: 'var(--color-accent-3)',  // Beige/cream
        },

        // ── LEGACY TOKENS (Backward Compatibility) ────────────────────
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
        cream: {
          DEFAULT: '#FFFEF4',
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

        // ── Tremor Integration ─────────────────────────────────────────
        tremor: {
          brand: {
            faint: '#091e1a',
            muted: '#0e3434',
            subtle: '#134a4e',
            DEFAULT: 'var(--color-brand-500)',
            emphasis: 'var(--color-brand-700)',
            inverted: 'var(--color-surface-inverse)',
          },
          background: {
            muted: 'var(--color-surface)',
            subtle: 'var(--color-surface-muted)',
            DEFAULT: 'var(--color-surface-subtle)',
            emphasis: 'var(--color-text-primary)',
          },
          border: { DEFAULT: 'var(--color-border)' },
          ring: { DEFAULT: 'var(--color-brand-500)' },
          content: {
            subtle: 'var(--color-text-subtle)',
            DEFAULT: 'var(--color-text-muted)',
            emphasis: 'var(--color-text-secondary)',
            strong: 'var(--color-text-primary)',
            inverted: 'var(--color-surface)',
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
