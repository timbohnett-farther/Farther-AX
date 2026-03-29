# Farther Brand Kit – All Platform Sites

This folder centralizes the branding system for all Farther platform sites (website, app, dashboards). It is optimized for Tailwind CSS, Tremor, and AI assistants like Claude or Perplexity that generate UI code.

---

## Contents

- `tokens/farther-platform-colors.json`
  - Single source of truth for all atomic palette colors and semantic tokens
  - Used by Tailwind config, Tremor theming, and design tools

- `docs/01-farther-brand-tokens.md`
  - Full spec for:
    - Core Farther palette (Steel, Mist, Ivory, etc.)
    - Light + Dark mode CSS variables
    - Tailwind semantic colors (`text.*`, `surface.*`, `border.*`, `accent.*`)
  - Use this when:
    - Updating colors
    - Wiring Tailwind or CSS variables
    - Generating new token JSON files

- `docs/02-farther-components-tremor.md`
  - Component recipes and Tremor chart theming:
    - Buttons (primary, secondary, ghost, status)
    - Cards, KPI stats, "glass" surfaces
    - Status colors:
      - Positive: rich green
      - Caution: burnt orange
      - Negative: brick red
    - Tremor theme mapping (`tremor` / `dark-tremor`)
    - Chart color arrays and examples
  - Use this when:
    - Building screens and flows
    - Implementing dashboards and charts
    - Creating new pills, badges, and alerts

---

## How to use with AI (Claude, Perplexity, etc.)

When asking an AI assistant to design or code Farther UI:

1. Provide both docs:
   - `01-farther-brand-tokens.md`
   - `02-farther-components-tremor.md`
2. Tell the model:
   - "Use these specs as the single source of truth."
   - "Only use semantic Tailwind utilities (`bg-surface-soft`, `text-text`, `bg-accent-primary`, etc.) for UI."
   - "Use status colors for positive/caution/negative states."
3. For Tremor charts:
   - Use the Farther brand color arrays from `02-farther-components-tremor.md`.
   - Map Tremor theme keys to Farther tokens as defined there.

---

## Implementation order

1. **Tokens**
   - Keep `farther-platform-colors.json` updated first.
   - Import it into `tailwind/tailwind.config.js`.

2. **Theme**
   - Apply the CSS variables from `01-farther-brand-tokens.md` in `globals.css`.
   - Ensure `.dark` class toggles dark mode.

3. **Components & Charts**
   - Build buttons, cards, nav, and Tremor charts using patterns from `02-farther-components-tremor.md`.
   - Never hard‑code hex values in components; always rely on semantic classes.

---

## Source of truth

If any discrepancy appears between code and docs:

1. `tokens/farther-platform-colors.json` is **canonical** for raw color values.
2. `docs/01-farther-brand-tokens.md` is canonical for theming & semantics.
3. `docs/02-farther-components-tremor.md` is canonical for component usage and Tremor integration.

All Farther platform sites should conform to this Brand Kit.
