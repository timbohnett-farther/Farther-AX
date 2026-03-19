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
        cream: "#ffffff",
        "cream-dark": "#f0f5f9",
        "cream-border": "#dde8f0",
        gold: "#1d7682",
        "gold-dark": "#155961",
        "gold-light": "#b6d0ed",
        charcoal: "#333333",
        "charcoal-light": "#444444",
        "charcoal-muted": "#5b6a71",
        teal: "#1d7682",
        "teal-dark": "#155961",
        "teal-light": "#b6d0ed",
        slate: "#5b6a71",
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
