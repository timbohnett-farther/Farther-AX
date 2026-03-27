# Farther Brand Tokens

**Version:** 1.0
**Last Updated:** 2026-03-24
**Purpose:** Complete design token specification for Farther Finance brand system

---

## Overview

This document defines the complete design token system for Farther Finance, including core brand colors, semantic tokens, light/dark mode mappings, and integration patterns for Tailwind CSS and Tremor components.

### Key Principles

1. **OKLCH color space** for perceptual uniformity and smooth gradients
2. **Semantic tokens** for all UI decisions (never hardcode hex values)
3. **Light & Dark mode parity** - every color has both modes defined
4. **RGB triplets** for alpha channel support
5. **Accessibility-first** - WCAG AA minimum for all text/background combinations

---

## Core Brand Palette

### Primary: Farther Plum

The signature Farther plum color - rich, sophisticated, financial-grade purple.

```
plum-50:  #FAF8FC  oklch(0.982 0.008 310)
plum-100: #F3EEF9  oklch(0.950 0.020 310)
plum-200: #E8DFF4  oklch(0.910 0.038 310)
plum-300: #D7C4E9  oklch(0.840 0.065 310)
plum-400: #C09FDB  oklch(0.740 0.095 310)
plum-500: #A777CA  oklch(0.630 0.120 310)  ← Primary brand color
plum-600: #8E5BB3  oklch(0.530 0.130 310)
plum-700: #7545A0  oklch(0.450 0.125 310)
plum-800: #5E3882  oklch(0.370 0.110 310)
plum-900: #4D2F6A  oklch(0.310 0.090 310)
plum-950: #2F1C42  oklch(0.200 0.070 310)
```

**Usage:** Primary actions, brand moments, key CTAs, navigation highlights

### Secondary: Graphite

Sophisticated neutrals with subtle warm undertones for professional financial interfaces.

```
graphite-50:  #FAFAFA  oklch(0.985 0.000 0)
graphite-100: #F5F5F5  oklch(0.970 0.000 0)
graphite-200: #E8E8E8  oklch(0.930 0.000 0)
graphite-300: #D4D4D4  oklch(0.870 0.000 0)
graphite-400: #A3A3A3  oklch(0.710 0.000 0)
graphite-500: #737373  oklch(0.540 0.000 0)  ← Mid-point neutral
graphite-600: #525252  oklch(0.410 0.000 0)
graphite-700: #404040  oklch(0.340 0.000 0)
graphite-800: #262626  oklch(0.230 0.000 0)
graphite-900: #171717  oklch(0.170 0.000 0)
graphite-950: #0A0A0A  oklch(0.110 0.000 0)
```

**Usage:** Text hierarchy, borders, dividers, backgrounds, disabled states

### Accent: Emerald

Fresh, trustworthy green for positive financial outcomes and growth indicators.

```
emerald-50:  #F0FDF7  oklch(0.985 0.020 165)
emerald-100: #DCFCE8  oklch(0.970 0.040 165)
emerald-200: #BBF7D5  oklch(0.940 0.070 165)
emerald-300: #86EFAC  oklch(0.895 0.110 165)
emerald-400: #4ADE80  oklch(0.830 0.150 165)
emerald-500: #22C55E  oklch(0.730 0.170 165)  ← Primary green
emerald-600: #16A34A  oklch(0.610 0.175 165)
emerald-700: #15803D  oklch(0.500 0.160 165)
emerald-800: #166534  oklch(0.410 0.135 165)
emerald-900: #14532D  oklch(0.340 0.110 165)
emerald-950: #052E16  oklch(0.210 0.080 165)
```

**Usage:** Portfolio gains, positive returns, account growth, success states

### Warning: Amber

Attention-getting warm amber for caution states and important alerts.

```
amber-50:  #FFFBEB  oklch(0.990 0.020 85)
amber-100: #FEF3C7  oklch(0.970 0.045 85)
amber-200: #FDE68A  oklch(0.930 0.085 85)
amber-300: #FCD34D  oklch(0.870 0.130 85)
amber-400: #FBBF24  oklch(0.810 0.160 85)
amber-500: #F59E0B  oklch(0.730 0.175 85)  ← Primary amber
amber-600: #D97706  oklch(0.640 0.180 85)
amber-700: #B45309  oklch(0.540 0.165 85)
amber-800: #92400E  oklch(0.450 0.140 85)
amber-900: #78350F  oklch(0.380 0.115 85)
amber-950: #451A03  oklch(0.240 0.080 85)
```

**Usage:** Warnings, rebalancing alerts, review reminders, moderate risk

### Alert: Rose

Sophisticated rose/red for errors, losses, and critical alerts.

```
rose-50:  #FFF1F2  oklch(0.980 0.015 10)
rose-100: #FFE4E6  oklch(0.955 0.030 10)
rose-200: #FECDD3  oklch(0.910 0.055 10)
rose-300: #FDA4AF  oklch(0.840 0.090 10)
rose-400: #FB7185  oklch(0.735 0.135 10)
rose-500: #F43F5E  oklch(0.615 0.175 10)  ← Primary red
rose-600: #E11D48  oklch(0.525 0.190 10)
rose-700: #BE123C  oklch(0.445 0.185 10)
rose-800: #9F1239  oklch(0.380 0.165 10)
rose-900: #881337  oklch(0.325 0.140 10)
rose-950: #4C0519  oklch(0.210 0.100 10)
```

**Usage:** Portfolio losses, errors, deletions, critical warnings, churn risk

---

## Light Mode CSS Variables

Define these in your `globals.css` or design token file:

```css
:root {
  /* ===== SURFACES ===== */
  --color-surface: 255 255 255;              /* Pure white backgrounds */
  --color-surface-muted: 250 250 250;        /* Subtle off-white (graphite-50) */
  --color-surface-subtle: 245 245 245;       /* Hover states, disabled fields (graphite-100) */
  --color-surface-inverted: 23 23 23;        /* Dark text on light (graphite-900) */

  /* ===== TEXT ===== */
  --color-text-primary: 23 23 23;            /* Body text, headings (graphite-900) */
  --color-text-secondary: 82 82 82;          /* Supporting text, labels (graphite-600) */
  --color-text-muted: 115 115 115;           /* Placeholder, disabled (graphite-500) */
  --color-text-inverted: 250 250 250;        /* White text on dark (graphite-50) */

  /* ===== BORDERS ===== */
  --color-border: 232 232 232;               /* Standard dividers (graphite-200) */
  --color-border-strong: 212 212 212;        /* Emphasized borders (graphite-300) */
  --color-border-subtle: 245 245 245;        /* Very light dividers (graphite-100) */

  /* ===== BRAND PRIMARY (Plum) ===== */
  --color-brand-50: 250 248 252;
  --color-brand-100: 243 238 249;
  --color-brand-200: 232 223 244;
  --color-brand-300: 215 196 233;
  --color-brand-400: 192 159 219;
  --color-brand-500: 167 119 202;            /* Primary brand */
  --color-brand-600: 142 91 179;
  --color-brand-700: 117 69 160;
  --color-brand-800: 94 56 130;
  --color-brand-900: 77 47 106;
  --color-brand-950: 47 28 66;

  /* ===== ACCENT (Emerald) ===== */
  --color-accent-50: 240 253 247;
  --color-accent-100: 220 252 232;
  --color-accent-200: 187 247 213;
  --color-accent-300: 134 239 172;
  --color-accent-400: 74 222 128;
  --color-accent-500: 34 197 94;             /* Primary green */
  --color-accent-600: 22 163 74;
  --color-accent-700: 21 128 61;
  --color-accent-800: 22 101 52;
  --color-accent-900: 20 83 45;
  --color-accent-950: 5 46 22;

  /* ===== STATUS COLORS ===== */
  /* Success (Emerald) */
  --color-success: 34 197 94;                /* emerald-500 */
  --color-success-bg: 220 252 232;           /* emerald-100 */
  --color-success-border: 187 247 213;       /* emerald-200 */
  --color-success-text: 21 128 61;           /* emerald-700 */

  /* Warning (Amber) */
  --color-warning: 245 158 11;               /* amber-500 */
  --color-warning-bg: 254 243 199;           /* amber-100 */
  --color-warning-border: 253 230 138;       /* amber-200 */
  --color-warning-text: 180 83 9;            /* amber-700 */

  /* Error (Rose) */
  --color-error: 244 63 94;                  /* rose-500 */
  --color-error-bg: 255 228 230;             /* rose-100 */
  --color-error-border: 254 205 211;         /* rose-200 */
  --color-error-text: 190 18 60;             /* rose-700 */

  /* Info (Plum) */
  --color-info: 167 119 202;                 /* plum-500 */
  --color-info-bg: 243 238 249;              /* plum-100 */
  --color-info-border: 232 223 244;          /* plum-200 */
  --color-info-text: 117 69 160;             /* plum-700 */

  /* ===== SHADOWS ===== */
  --shadow-card: 0 1px 3px rgb(0 0 0 / 0.08), 0 1px 2px rgb(0 0 0 / 0.05);
  --shadow-elevated: 0 4px 6px rgb(0 0 0 / 0.07), 0 2px 4px rgb(0 0 0 / 0.06);
  --shadow-modal: 0 20px 25px rgb(0 0 0 / 0.10), 0 8px 10px rgb(0 0 0 / 0.04);

  /* ===== INTERACTIVE STATES ===== */
  --color-hover-bg: 243 238 249;             /* plum-100 */
  --color-active-bg: 232 223 244;            /* plum-200 */
  --color-focus-ring: 167 119 202;           /* plum-500 */
}
```

---

## Dark Mode CSS Variables

Define these with `@media (prefers-color-scheme: dark)` or `.dark` class:

```css
@media (prefers-color-scheme: dark) {
  :root {
    /* ===== SURFACES ===== */
    --color-surface: 23 23 23;               /* graphite-900 base */
    --color-surface-muted: 38 38 38;         /* Slightly elevated (custom) */
    --color-surface-subtle: 64 64 64;        /* Cards, hover states (graphite-700) */
    --color-surface-inverted: 250 250 250;   /* Light text on dark (graphite-50) */

    /* ===== TEXT ===== */
    --color-text-primary: 245 245 245;       /* Body text (graphite-100) */
    --color-text-secondary: 163 163 163;     /* Supporting text (graphite-400) */
    --color-text-muted: 115 115 115;         /* Placeholder text (graphite-500) */
    --color-text-inverted: 23 23 23;         /* Dark text on light (graphite-900) */

    /* ===== BORDERS ===== */
    --color-border: 64 64 64;                /* Standard dividers (graphite-700) */
    --color-border-strong: 82 82 82;         /* Emphasized borders (graphite-600) */
    --color-border-subtle: 38 38 38;         /* Subtle dividers (custom) */

    /* ===== BRAND PRIMARY (Plum - brightened) ===== */
    --color-brand-50: 47 28 66;
    --color-brand-100: 77 47 106;
    --color-brand-200: 94 56 130;
    --color-brand-300: 117 69 160;
    --color-brand-400: 142 91 179;
    --color-brand-500: 192 159 219;          /* Brightened for dark mode */
    --color-brand-600: 215 196 233;
    --color-brand-700: 232 223 244;
    --color-brand-800: 243 238 249;
    --color-brand-900: 250 248 252;
    --color-brand-950: 250 248 252;

    /* ===== ACCENT (Emerald - brightened) ===== */
    --color-accent-50: 5 46 22;
    --color-accent-100: 20 83 45;
    --color-accent-200: 22 101 52;
    --color-accent-300: 21 128 61;
    --color-accent-400: 22 163 74;
    --color-accent-500: 74 222 128;          /* Brightened for dark mode */
    --color-accent-600: 134 239 172;
    --color-accent-700: 187 247 213;
    --color-accent-800: 220 252 232;
    --color-accent-900: 240 253 247;
    --color-accent-950: 240 253 247;

    /* ===== STATUS COLORS (Dark Mode) ===== */
    /* Success */
    --color-success: 74 222 128;             /* emerald-400 */
    --color-success-bg: 22 101 52;           /* emerald-800 */
    --color-success-border: 21 128 61;       /* emerald-700 */
    --color-success-text: 187 247 213;       /* emerald-200 */

    /* Warning */
    --color-warning: 251 191 36;             /* amber-400 */
    --color-warning-bg: 146 64 14;           /* amber-800 */
    --color-warning-border: 180 83 9;        /* amber-700 */
    --color-warning-text: 253 230 138;       /* amber-200 */

    /* Error */
    --color-error: 251 113 133;              /* rose-400 */
    --color-error-bg: 159 18 57;             /* rose-800 */
    --color-error-border: 190 18 60;         /* rose-700 */
    --color-error-text: 254 205 211;         /* rose-200 */

    /* Info */
    --color-info: 192 159 219;               /* plum-400 */
    --color-info-bg: 94 56 130;              /* plum-800 */
    --color-info-border: 117 69 160;         /* plum-700 */
    --color-info-text: 232 223 244;          /* plum-200 */

    /* ===== SHADOWS (darker, more pronounced) ===== */
    --shadow-card: 0 1px 3px rgb(0 0 0 / 0.20), 0 1px 2px rgb(0 0 0 / 0.12);
    --shadow-elevated: 0 4px 6px rgb(0 0 0 / 0.25), 0 2px 4px rgb(0 0 0 / 0.15);
    --shadow-modal: 0 20px 25px rgb(0 0 0 / 0.40), 0 8px 10px rgb(0 0 0 / 0.20);

    /* ===== INTERACTIVE STATES ===== */
    --color-hover-bg: 94 56 130;             /* plum-800 */
    --color-active-bg: 77 47 106;            /* plum-900 */
    --color-focus-ring: 192 159 219;         /* plum-400 (brightened) */
  }
}
```

---

## Tailwind CSS Integration

### Complete `tailwind.config.ts`

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces
        surface: {
          DEFAULT: "rgb(var(--color-surface) / <alpha-value>)",
          muted: "rgb(var(--color-surface-muted) / <alpha-value>)",
          subtle: "rgb(var(--color-surface-subtle) / <alpha-value>)",
          inverted: "rgb(var(--color-surface-inverted) / <alpha-value>)",
        },

        // Text
        text: {
          primary: "rgb(var(--color-text-primary) / <alpha-value>)",
          secondary: "rgb(var(--color-text-secondary) / <alpha-value>)",
          muted: "rgb(var(--color-text-muted) / <alpha-value>)",
          inverted: "rgb(var(--color-text-inverted) / <alpha-value>)",
        },

        // Borders
        border: {
          DEFAULT: "rgb(var(--color-border) / <alpha-value>)",
          strong: "rgb(var(--color-border-strong) / <alpha-value>)",
          subtle: "rgb(var(--color-border-subtle) / <alpha-value>)",
        },

        // Brand (Plum)
        brand: {
          50: "rgb(var(--color-brand-50) / <alpha-value>)",
          100: "rgb(var(--color-brand-100) / <alpha-value>)",
          200: "rgb(var(--color-brand-200) / <alpha-value>)",
          300: "rgb(var(--color-brand-300) / <alpha-value>)",
          400: "rgb(var(--color-brand-400) / <alpha-value>)",
          500: "rgb(var(--color-brand-500) / <alpha-value>)",
          600: "rgb(var(--color-brand-600) / <alpha-value>)",
          700: "rgb(var(--color-brand-700) / <alpha-value>)",
          800: "rgb(var(--color-brand-800) / <alpha-value>)",
          900: "rgb(var(--color-brand-900) / <alpha-value>)",
          950: "rgb(var(--color-brand-950) / <alpha-value>)",
        },

        // Accent (Emerald)
        accent: {
          50: "rgb(var(--color-accent-50) / <alpha-value>)",
          100: "rgb(var(--color-accent-100) / <alpha-value>)",
          200: "rgb(var(--color-accent-200) / <alpha-value>)",
          300: "rgb(var(--color-accent-300) / <alpha-value>)",
          400: "rgb(var(--color-accent-400) / <alpha-value>)",
          500: "rgb(var(--color-accent-500) / <alpha-value>)",
          600: "rgb(var(--color-accent-600) / <alpha-value>)",
          700: "rgb(var(--color-accent-700) / <alpha-value>)",
          800: "rgb(var(--color-accent-800) / <alpha-value>)",
          900: "rgb(var(--color-accent-900) / <alpha-value>)",
          950: "rgb(var(--color-accent-950) / <alpha-value>)",
        },

        // Status colors
        success: {
          DEFAULT: "rgb(var(--color-success) / <alpha-value>)",
          bg: "rgb(var(--color-success-bg) / <alpha-value>)",
          border: "rgb(var(--color-success-border) / <alpha-value>)",
          text: "rgb(var(--color-success-text) / <alpha-value>)",
        },

        warning: {
          DEFAULT: "rgb(var(--color-warning) / <alpha-value>)",
          bg: "rgb(var(--color-warning-bg) / <alpha-value>)",
          border: "rgb(var(--color-warning-border) / <alpha-value>)",
          text: "rgb(var(--color-warning-text) / <alpha-value>)",
        },

        error: {
          DEFAULT: "rgb(var(--color-error) / <alpha-value>)",
          bg: "rgb(var(--color-error-bg) / <alpha-value>)",
          border: "rgb(var(--color-error-border) / <alpha-value>)",
          text: "rgb(var(--color-error-text) / <alpha-value>)",
        },

        info: {
          DEFAULT: "rgb(var(--color-info) / <alpha-value>)",
          bg: "rgb(var(--color-info-bg) / <alpha-value>)",
          border: "rgb(var(--color-info-border) / <alpha-value>)",
          text: "rgb(var(--color-info-text) / <alpha-value>)",
        },
      },

      boxShadow: {
        card: "var(--shadow-card)",
        elevated: "var(--shadow-elevated)",
        modal: "var(--shadow-modal)",
      },

      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },

      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
    },
  },
  plugins: [],
};

export default config;
```

### Usage Examples

```tsx
// Semantic surface colors
<div className="bg-surface text-text-primary border border-border">
  <p className="text-text-secondary">Supporting text</p>
</div>

// Brand colors
<button className="bg-brand-500 hover:bg-brand-600 text-white">
  Primary Action
</button>

// Status colors
<div className="bg-success-bg border border-success-border text-success-text">
  Portfolio up 12.4%
</div>

// Alpha channel support
<div className="bg-brand-500/10 border border-brand-500/30">
  Subtle brand highlight
</div>

// Dark mode automatic
<div className="bg-surface text-text-primary">
  Automatically adapts to dark mode
</div>
```

---

## Charts & Data Visualization

### Semantic Chart Colors

Use these semantic mappings for consistent financial data visualization:

```typescript
export const chartColors = {
  // Performance & Growth
  positive: "rgb(var(--color-accent-500))",      // emerald-500 (light) / emerald-400 (dark)
  neutral: "rgb(var(--color-brand-500))",        // plum-500 (light) / plum-400 (dark)
  negative: "rgb(var(--color-error))",           // rose-500 (light) / rose-400 (dark)

  // Multi-series charts (6 colors)
  series: [
    "rgb(var(--color-brand-500))",    // Plum (primary)
    "rgb(var(--color-accent-500))",   // Emerald
    "rgb(var(--color-brand-300))",    // Light plum
    "rgb(var(--color-accent-700))",   // Dark emerald
    "rgb(var(--color-brand-700))",    // Dark plum
    "rgb(var(--color-accent-300))",   // Light emerald
  ],

  // Asset allocation
  equities: "rgb(var(--color-brand-500))",
  fixedIncome: "rgb(var(--color-accent-500))",
  alternatives: "rgb(var(--color-brand-300))",
  cash: "rgb(var(--color-text-muted))",

  // Benchmark comparison
  portfolio: "rgb(var(--color-brand-500))",
  benchmark: "rgb(var(--color-text-muted))",
};
```

### Chart Implementation Example

```tsx
import { AreaChart } from "@/components/tremor/AreaChart";

<AreaChart
  data={performanceData}
  index="date"
  categories={["portfolio", "benchmark"]}
  colors={["brand-500", "text-muted"]}
  valueFormatter={(value) => `$${value.toLocaleString()}`}
  className="h-72"
/>
```

---

## Avatars & Initials

### Avatar Color Mapping

Use plum variants for user avatars:

```typescript
export function getAvatarColor(userId: string): string {
  const colors = [
    "bg-brand-400 text-white",
    "bg-brand-500 text-white",
    "bg-brand-600 text-white",
    "bg-brand-300 text-brand-900",
    "bg-brand-200 text-brand-900",
  ];

  const hash = userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}
```

### Avatar Component

```tsx
interface AvatarProps {
  name: string;
  userId: string;
  size?: "sm" | "md" | "lg";
}

export function Avatar({ name, userId, size = "md" }: AvatarProps) {
  const initials = name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  };

  return (
    <div className={cn(
      "flex items-center justify-center rounded-full font-semibold",
      getAvatarColor(userId),
      sizeClasses[size]
    )}>
      {initials}
    </div>
  );
}
```

---

## Badges & Pills

### Badge Variants

```tsx
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
  {
    variants: {
      variant: {
        success: "bg-success-bg text-success-text ring-success-border",
        warning: "bg-warning-bg text-warning-text ring-warning-border",
        error: "bg-error-bg text-error-text ring-error-border",
        info: "bg-info-bg text-info-text ring-info-border",
        neutral: "bg-surface-subtle text-text-secondary ring-border",
        brand: "bg-brand-500/10 text-brand-700 ring-brand-500/30 dark:text-brand-300",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
);

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: React.ReactNode;
}

export function Badge({ variant, children }: BadgeProps) {
  return (
    <span className={badgeVariants({ variant })}>
      {children}
    </span>
  );
}
```

### Usage

```tsx
<Badge variant="success">Active</Badge>
<Badge variant="warning">Review Needed</Badge>
<Badge variant="error">At Risk</Badge>
<Badge variant="brand">Platinum Tier</Badge>
```

---

## JSON Design Tokens

For design tool integration (Figma, Tokens Studio, etc.):

```json
{
  "farther": {
    "colors": {
      "brand": {
        "plum": {
          "50": { "value": "#FAF8FC", "type": "color" },
          "100": { "value": "#F3EEF9", "type": "color" },
          "200": { "value": "#E8DFF4", "type": "color" },
          "300": { "value": "#D7C4E9", "type": "color" },
          "400": { "value": "#C09FDB", "type": "color" },
          "500": { "value": "#A777CA", "type": "color", "description": "Primary brand color" },
          "600": { "value": "#8E5BB3", "type": "color" },
          "700": { "value": "#7545A0", "type": "color" },
          "800": { "value": "#5E3882", "type": "color" },
          "900": { "value": "#4D2F6A", "type": "color" },
          "950": { "value": "#2F1C42", "type": "color" }
        }
      },
      "semantic": {
        "surface": {
          "default": { "value": "{colors.base.white}", "type": "color" },
          "muted": { "value": "{colors.graphite.50}", "type": "color" },
          "subtle": { "value": "{colors.graphite.100}", "type": "color" }
        },
        "text": {
          "primary": { "value": "{colors.graphite.900}", "type": "color" },
          "secondary": { "value": "{colors.graphite.600}", "type": "color" },
          "muted": { "value": "{colors.graphite.500}", "type": "color" }
        },
        "status": {
          "success": { "value": "{colors.emerald.500}", "type": "color" },
          "warning": { "value": "{colors.amber.500}", "type": "color" },
          "error": { "value": "{colors.rose.500}", "type": "color" },
          "info": { "value": "{colors.plum.500}", "type": "color" }
        }
      }
    },
    "spacing": {
      "xs": { "value": "4px", "type": "dimension" },
      "sm": { "value": "8px", "type": "dimension" },
      "md": { "value": "16px", "type": "dimension" },
      "lg": { "value": "24px", "type": "dimension" },
      "xl": { "value": "32px", "type": "dimension" },
      "2xl": { "value": "48px", "type": "dimension" }
    },
    "borderRadius": {
      "sm": { "value": "6px", "type": "dimension" },
      "md": { "value": "8px", "type": "dimension" },
      "lg": { "value": "12px", "type": "dimension" },
      "full": { "value": "9999px", "type": "dimension" }
    },
    "shadows": {
      "card": {
        "value": "0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.05)",
        "type": "boxShadow"
      },
      "elevated": {
        "value": "0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06)",
        "type": "boxShadow"
      },
      "modal": {
        "value": "0 20px 25px rgba(0, 0, 0, 0.10), 0 8px 10px rgba(0, 0, 0, 0.04)",
        "type": "boxShadow"
      }
    },
    "typography": {
      "fontFamily": {
        "sans": { "value": "Inter, system-ui, sans-serif", "type": "fontFamily" },
        "mono": { "value": "JetBrains Mono, monospace", "type": "fontFamily" }
      },
      "fontSize": {
        "xs": { "value": "12px", "type": "dimension" },
        "sm": { "value": "14px", "type": "dimension" },
        "base": { "value": "16px", "type": "dimension" },
        "lg": { "value": "18px", "type": "dimension" },
        "xl": { "value": "20px", "type": "dimension" },
        "2xl": { "value": "24px", "type": "dimension" },
        "3xl": { "value": "30px", "type": "dimension" }
      }
    }
  }
}
```

---

## Implementation Checklist

### For Claude / AI Assistants

When building Farther UI:

- [ ] Use semantic tokens (`surface`, `text-primary`, `brand-500`) - never hex codes
- [ ] Include `dark:` variants for all color classes OR use semantic tokens
- [ ] Use `rgb(var(--color-*) / <alpha-value>)` pattern for alpha support
- [ ] Apply `shadow-card` / `shadow-elevated` for depth
- [ ] Use `border-border` for all dividers
- [ ] Brand actions use `bg-brand-500 hover:bg-brand-600`
- [ ] Success states use `accent-500` (emerald)
- [ ] Error states use `error` (rose)
- [ ] Chart colors use semantic mappings from `chartColors`
- [ ] Avatars use `getAvatarColor()` for consistent plum variants

### For Developers

1. Copy CSS variables to `app/globals.css`
2. Update `tailwind.config.ts` with extended theme
3. Install required packages: `tailwindcss`, `class-variance-authority`, `clsx`, `tailwind-merge`
4. Create `lib/utils.ts` with `cn()` helper
5. Test both light and dark modes
6. Verify WCAG AA contrast ratios
7. Document any custom color usage

---

## Resources

- **Figma File:** [Link to Farther design system]
- **Storybook:** [Link to component library]
- **Color Contrast Checker:** https://webaim.org/resources/contrastchecker/
- **OKLCH Color Picker:** https://oklch.com/

---

**Questions or Updates?**
Contact design system team or update this document directly.
