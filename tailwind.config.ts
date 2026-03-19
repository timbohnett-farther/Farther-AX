import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#F5F0EB",
        "cream-dark": "#EDE7DF",
        "cream-border": "#D8CFC4",
        gold: "#B8977E",
        "gold-dark": "#9A7A62",
        "gold-light": "#D4B896",
        charcoal: "#2D2D2D",
        "charcoal-light": "#4A4A4A",
        "charcoal-muted": "#6B6B6B",
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
