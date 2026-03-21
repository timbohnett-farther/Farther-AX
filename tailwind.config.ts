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
        // Tremor color mappings — Tremor reads these at build time
        tremor: {
          brand: {
            faint: "#FAF7F2",
            muted: "#F0EBE3",
            subtle: "#a3d4d9",
            DEFAULT: "#1d7682",
            emphasis: "#155a63",
            inverted: "#FFFFFF",
          },
          background: {
            muted: "#FAF7F2",
            subtle: "#F0EBE3",
            DEFAULT: "#FFFFFF",
            emphasis: "#333333",
          },
          border: {
            DEFAULT: "#E0DCD6",
          },
          ring: {
            DEFAULT: "#1d7682",
          },
          content: {
            subtle: "#888888",
            DEFAULT: "#555555",
            emphasis: "#333333",
            strong: "#000000",
            inverted: "#FFFFFF",
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
