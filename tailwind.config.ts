import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    './node_modules/@tremor/**/*.{js,ts,jsx,tsx}', // Include Tremor components
  ],
  theme: {
    extend: {
      colors: {
        // Legacy Farther brand colors (keep for compatibility)
        cream: "#FAF7F2",
        "cream-dark": "#F2EDE5",
        "cream-border": "#E8E0D5",
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

        // Farther brand colors mapped to Tremor theme
        tremor: {
          brand: {
            faint: '#FAF7F2',    // Farther cream
            muted: '#F0EBE3',    // Farther cream-dark
            subtle: '#a3d4d9',   // Farther teal-muted
            DEFAULT: '#1d7682',  // Farther teal (primary)
            emphasis: '#155a63', // Farther teal-dark
            inverted: '#FFFFFF',
          },
          background: {
            muted: '#FAF7F2',
            subtle: '#F0EBE3',
            DEFAULT: '#FFFFFF',
            emphasis: '#333333',
          },
          border: {
            DEFAULT: '#E0DCD6',
          },
          ring: {
            DEFAULT: '#1d7682',
          },
          content: {
            subtle: '#888888',
            DEFAULT: '#555555',
            emphasis: '#333333',
            strong: '#000000',
            inverted: '#FFFFFF',
          },
        },
        // Financial market colors
        market: {
          bull: '#10b981',      // Green for gains
          'bull-light': '#d1fae5',
          'bull-dark': '#059669',
          bear: '#ef4444',      // Red for losses
          'bear-light': '#fee2e2',
          'bear-dark': '#dc2626',
          neutral: '#6b7280',   // Gray for flat
        },
        // Premium wealth management palette (tier colors)
        wealth: {
          gold: '#f59e0b',
          'gold-light': '#fef3c7',
          'gold-dark': '#d97706',
          silver: '#94a3b8',
          platinum: '#e0e7ff',
          bronze: '#d97706',
        },
        // Glass effect colors
        glass: {
          white: 'rgba(255, 255, 255, 0.7)',
          'white-light': 'rgba(255, 255, 255, 0.9)',
          'white-dark': 'rgba(255, 255, 255, 0.5)',
          teal: 'rgba(29, 118, 130, 0.1)',
          'teal-light': 'rgba(29, 118, 130, 0.05)',
          'teal-dark': 'rgba(29, 118, 130, 0.15)',
        },
      },
      fontFamily: {
        serif: ["'ABC Arizona Text'", 'Georgia', 'Times New Roman', 'serif'],
        sans: ["'Fakt'", 'system-ui', 'sans-serif'],
        mono: ['SF Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-wealth': 'linear-gradient(135deg, #1d7682 0%, #a3d4d9 100%)',
        'gradient-bull': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        'gradient-bear': 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        'gradient-gold': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        'gradient-glass': 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'glass-hover': '0 12px 40px 0 rgba(31, 38, 135, 0.12)',
        'glow-teal': '0 0 20px rgba(29, 118, 130, 0.4)',
        'glow-bull': '0 0 20px rgba(16, 185, 129, 0.4)',
        'glow-bear': '0 0 20px rgba(239, 68, 68, 0.4)',
      },
      animation: {
        'shimmer': 'shimmer 2s infinite linear',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(29, 118, 130, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(29, 118, 130, 0.8)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};

export default config;
