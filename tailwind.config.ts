import type { Config } from "tailwindcss";

/**
 * Slim Tailwind config kept for Tremor 3.x compatibility.
 * Tremor scans this file for its color tokens.
 * All custom theme values now live in app/globals.css @theme block.
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
        // Tremor color mappings — dark theme
        tremor: {
          brand: {
            faint: "#0f2e32",
            muted: "#122d30",
            subtle: "#1a5560",
            DEFAULT: "#1d7682",
            emphasis: "#2a9aa8",
            inverted: "#e0dbd3",
          },
          background: {
            muted: "#121212",
            subtle: "#1a1a1a",
            DEFAULT: "#1e1e1e",
            emphasis: "#e0dbd3",
          },
          border: {
            DEFAULT: "#2a2a2a",
          },
          ring: {
            DEFAULT: "#1d7682",
          },
          content: {
            subtle: "#6a6a6a",
            DEFAULT: "#8a8a8a",
            emphasis: "#c8c2ba",
            strong: "#e0dbd3",
            inverted: "#121212",
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
