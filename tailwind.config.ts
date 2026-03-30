import type { Config } from "tailwindcss";

/**
 * Farther AX — Tailwind Config (Layout-Only)
 * All colors are driven by the THEME object in lib/theme.ts via inline styles.
 * Tailwind is used ONLY for layout utilities (flex, grid, spacing, responsive).
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
    extend: {},
  },
  plugins: [],
};

export default config;
