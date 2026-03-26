# Farther — Font Gold Standard Guide
*For AI Coders: Website Typography Rebuild*

***

## Purpose

This document is the single source of truth for all typography decisions on the Farther website and advisor portal. Every AI coding agent working on this codebase must follow this guide precisely. Do not introduce new fonts, override these settings locally, or use inline font styles unless explicitly permitted below.

***

## Primary Font: Inter

**Inter is the only approved sans-serif font for this project.**

Inter was built from the ground up for screen rendering, data density, and cross-platform consistency. It is the industry standard for fintech dashboards, SaaS platforms, and data-heavy web applications. It is free via Google Fonts, has zero licensing restrictions, and deploys cleanly on Railway.

**No other body/UI font is permitted without explicit approval.**

***

## Monospace Font: DM Mono

**DM Mono is the only approved monospace font.**

Use it exclusively for: raw account numbers, identifiers, API-style data strings, and any field where fixed-character-width alignment is critical beyond what tabular-nums provides.

***

## Global Font Installation

### Step 1 — Load from Google Fonts in `<head>`

Place this in the `<head>` of every HTML page or in your base layout file. This must be the very first stylesheet loaded.

```html
<!-- Google Fonts: Inter + DM Mono -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;450;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### Step 2 — Tailwind v4 CSS Theme Configuration

Add to your global CSS file (e.g., `globals.css` or `app.css`):

```css
@import "tailwindcss";

@theme {
  --font-sans: "Inter", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: "DM Mono", "Courier New", Courier, monospace;
}
```

### Step 3 — Global Base Styles

```css
@layer base {
  html {
    font-family: var(--font-sans);
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  /* ALL numbers, currency, percentages, and financial data */
  .number,
  td,
  th,
  [data-type="currency"],
  [data-type="percentage"],
  [data-type="metric"] {
    font-variant-numeric: tabular-nums lining-nums;
    font-feature-settings: "tnum" 1, "lnum" 1, "zero" 1;
  }
}
```

***

## The Tabular Numbers Rule

> **This is the most important rule in this entire guide. Do not skip it.**

### What Are Tabular Numbers?

In standard fonts, digits have different widths. The number `1` is narrower than `8`. This causes columns of financial figures to misalign and visually "shift" as values change — a serious credibility problem on a wealth management platform.

**Tabular numbers** force every digit (0–9) to occupy the exact same horizontal width, so columns always align perfectly.

### When to Use It

Apply `tabular-nums` to **every element** that displays:
- Dollar amounts (`$7,234,891.00`)
- Percentages (`+4.38%`)
- AUM figures
- Performance returns
- Account numbers
- Any numeric data in a table, card, or chart

### Tailwind Utility Class

```html
<!-- Always use this on financial numbers -->
<span class="tabular-nums">$1,234,567.89</span>

<!-- Table cells — always right-align and tabular -->
<td class="tabular-nums text-right font-medium">$842,000</td>
```

### Full Feature Set for Metric Values

For KPI cards, headline AUM figures, and prominent financial callouts, use this class combination:

```html
<p class="font-mono tabular-nums lining-nums slashed-zero text-right">
  $16,000,000,000
</p>
```

Or in CSS:
```css
.financial-metric {
  font-family: "Inter", sans-serif;
  font-feature-settings: "tnum" 1, "lnum" 1, "zero" 1, "ss01" 1;
  font-variant-numeric: tabular-nums lining-nums;
}
```

***

## Typography Scale

This is the complete, approved font size and weight hierarchy. Use **only** these values.

### Tailwind Classes Reference

| Element | Tailwind Classes | Size | Weight | Notes |
|---|---|---|---|---|
| Page Title / Hero | `text-4xl font-bold` | 36px | 700 | Homepage, landing sections |
| Section Heading (H2) | `text-3xl font-bold` | 30px | 700 | Major page sections |
| Card / Panel Heading (H3) | `text-2xl font-semibold` | 24px | 600 | Dashboard panels |
| Subheading (H4) | `text-xl font-semibold` | 20px | 600 | Sub-sections, labels |
| Body Text (Default) | `text-base font-normal` | 16px | 400 | All standard paragraphs |
| Table Header | `text-sm font-semibold uppercase tracking-wide` | 14px | 600 | `COLUMN NAME` style |
| Table Data / Numbers | `text-sm tabular-nums text-right` | 14px | 400-500 | All financial figures |
| Secondary Labels | `text-sm font-medium` | 14px | 500 | Form labels, helper text |
| Captions / Fine Print | `text-xs font-normal` | 12px | 400 | Footnotes, disclaimers |
| KPI / Large Metric | `text-5xl font-bold tabular-nums` | 48px | 700 | AUM hero numbers |
| Input Fields | `text-base font-normal` | 16px | 400 | **Never below 16px** — prevents iOS zoom |

***

## Font Weight Standards

| Weight | Usage |
|---|---|
| `font-light` (300) | Decorative large display text only |
| `font-normal` (400) | Body copy, table data, descriptions |
| `font-medium` (500) | Emphasized data, important table values |
| `font-semibold` (600) | Subheadings, labels, card titles |
| `font-bold` (700) | Page titles, section headers, CTAs |
| `font-extrabold` (800) | Hero headlines only, sparingly |

***

## Line Height and Letter Spacing

```css
@layer base {
  /* Headings: tighter line height for visual impact */
  h1, h2, h3 { line-height: 1.2; letter-spacing: -0.02em; }

  /* Subheadings: slightly relaxed */
  h4, h5, h6 { line-height: 1.35; letter-spacing: -0.01em; }

  /* Body: optimized for reading */
  p, li, td { line-height: 1.6; letter-spacing: 0; }

  /* Table headers: uppercase with wide tracking */
  th {
    line-height: 1.4;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    font-size: 0.75rem;
    font-weight: 600;
  }

  /* Large financial metrics: tight for density */
  .kpi-value { line-height: 1.1; letter-spacing: -0.03em; }
}
```

***

## Component Patterns — Copy These Exactly

### KPI / AUM Card

```html
<div class="rounded-xl p-6 bg-white shadow-sm">
  <p class="text-sm font-semibold uppercase tracking-widest text-gray-500">
    Total AUM
  </p>
  <p class="text-5xl font-bold tabular-nums text-gray-900 mt-2">
    $16.2B
  </p>
  <p class="text-sm font-medium tabular-nums text-emerald-600 mt-1">
    +4.38% this quarter
  </p>
</div>
```

### Financial Data Table

```html
<table class="w-full text-sm">
  <thead>
    <tr class="border-b border-gray-200">
      <th class="text-left font-semibold uppercase tracking-wide text-gray-500 py-3 px-4">
        Account
      </th>
      <th class="text-right font-semibold uppercase tracking-wide text-gray-500 py-3 px-4">
        Value
      </th>
      <th class="text-right font-semibold uppercase tracking-wide text-gray-500 py-3 px-4">
        Return
      </th>
    </tr>
  </thead>
  <tbody>
    <tr class="border-b border-gray-100 hover:bg-gray-50">
      <td class="text-left font-medium text-gray-900 py-3 px-4">
        Bohnett — Trust Account
      </td>
      <td class="text-right tabular-nums font-medium text-gray-900 py-3 px-4">
        $2,847,302.18
      </td>
      <td class="text-right tabular-nums font-medium text-emerald-600 py-3 px-4">
        +6.22%
      </td>
    </tr>
  </tbody>
</table>
```

### Account / ID Number (Monospace)

```html
<span class="font-mono text-sm text-gray-600 tracking-wide">
  ACC-00847291-TX
</span>
```

***

## Responsive Font Sizing Rules

```css
@layer utilities {
  /* Scale down headings on mobile gracefully */
  .text-responsive-hero {
    font-size: clamp(2rem, 5vw, 3.5rem);
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.15;
  }

  .text-responsive-heading {
    font-size: clamp(1.5rem, 3vw, 2rem);
    font-weight: 600;
    letter-spacing: -0.015em;
  }
}
```

**Hard rules for mobile:**
- Body text minimum: `16px` — never smaller
- Table data minimum: `14px`
- Input fields: always `16px` to prevent iOS auto-zoom
- Captions: `12px` minimum

***

## What Is Explicitly Forbidden

| Never Do This | Why |
|---|---|
| Use Montserrat for numbers | Digits are proportional — columns misalign |
| Use Playfair Display or serif fonts in tables | Poor rendering at small sizes; not designed for data |
| Set `font-size` below 12px anywhere | Accessibility failure (WCAG AA) |
| Use `font-size` on inputs below 16px | Triggers unwanted zoom on iOS Safari |
| Mix more than 2 font families | Creates visual noise; breaks brand cohesion |
| Left-align financial number columns | Right-align always; tabular-nums always |
| Use raw `px` sizes in Tailwind components | Use only the Tailwind scale defined above |
| Use `font-weight: 900` | Too heavy for screens; not in spec |

***

## Quick-Reference Cheat Sheet

```
FONT FAMILY:    Inter (all UI) + DM Mono (identifiers only)
NUMBERS:        Always tabular-nums + text-right + lining-nums
BODY:           text-base (16px) / font-normal (400) / leading-relaxed
HEADINGS:       font-bold (700) or font-semibold (600) / tracking-tight
TABLE HEADERS:  text-sm / font-semibold / uppercase / tracking-widest
TABLE DATA:     text-sm / tabular-nums / text-right / font-medium
INPUTS:         text-base (16px minimum, no exceptions)
SMOOTHING:      -webkit-font-smoothing: antialiased (always on html element)
```

***

*This guide supersedes any prior font decisions in the codebase. When in doubt, use Inter + tabular-nums + right-align. That combination is always correct for financial data.*
