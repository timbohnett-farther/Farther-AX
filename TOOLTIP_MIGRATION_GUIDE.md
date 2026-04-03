# Tooltip Migration Guide

## Problem Statement

Browser-native tooltips (using the `title` attribute) don't respect custom color schemes and can have poor contrast in light mode, making text hard to read.

## Solution

Replace all `title` attributes with the custom `<Tooltip>` component that properly supports light/dark modes with readable text colors.

---

## Quick Reference

### ❌ Before (Browser Native - Poor Contrast)
```tsx
<button title="This is a tooltip">
  Click me
</button>
```

### ✅ After (Custom Component - Good Contrast)
```tsx
import { Tooltip } from '@/components/Tooltip';

<Tooltip content="This is a tooltip">
  <button>Click me</button>
</Tooltip>
```

---

## Color Behavior

### Light Mode
- **Background:** White (`bg-white`)
- **Text:** Dark gray (`text-gray-900`)
- **Border:** Light gray (`border-gray-200`)
- **Result:** Dark text on light background = High contrast ✅

### Dark Mode
- **Background:** Dark gray (`dark:bg-gray-800`)
- **Text:** Light gray (`dark:text-gray-100`)
- **Border:** Gray (`dark:border-gray-700`)
- **Result:** Light text on dark background = High contrast ✅

---

## Migration Pattern

### 1. Find All `title` Attributes

```bash
grep -r 'title=' --include="*.tsx" app/ components/
```

### 2. Import the Component

```tsx
import { Tooltip } from '@/components/Tooltip';
```

### 3. Replace Pattern

**Before:**
```tsx
<div title="User's complexity score">
  {score}
</div>
```

**After:**
```tsx
<Tooltip content="User's complexity score">
  <div>{score}</div>
</Tooltip>
```

### 4. Handle Dynamic Content

**Before:**
```tsx
<span title={`${tier} complexity — Score: ${score}/105`}>
  {tier}
</span>
```

**After:**
```tsx
<Tooltip content={`${tier} complexity — Score: ${score}/105`}>
  <span>{tier}</span>
</Tooltip>
```

---

## Advanced Options

### Position

```tsx
<Tooltip content="Appears on the right" position="right">
  <button>Hover me</button>
</Tooltip>
```

Available positions: `top` (default), `bottom`, `left`, `right`

### Delay

```tsx
<Tooltip content="Shows after 500ms" delay={500}>
  <button>Hover me</button>
</Tooltip>
```

Default delay: 200ms

---

## Priority Migration List

Based on grep results, these files have the most `title` attributes and should be migrated first:

### High Priority (User-facing pages)
1. `app/command-center/page.tsx` - Main dashboard with complexity scores
2. `app/command-center/advisor/[id]/page.tsx` - Advisor detail page
3. `app/command-center/metrics/page.tsx` - Metrics dashboard
4. `app/command-center/alerts/page.tsx` - Alerts page
5. `app/command-center/ria-hub/page.tsx` - RIA Hub

### Medium Priority (Secondary pages)
6. `app/command-center/onboarding/page.tsx`
7. `app/command-center/advisor-hub/page.tsx`
8. `app/breakaway-process/page.tsx`
9. `app/calendar-generator/page.tsx`

### Low Priority (Form pages - less frequently used)
10. Training/onboarding pages
11. Form pages

---

## Example: Command Center Page

### Before (line 300)
```tsx
<div
  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
  title={`${tier} complexity — Score: ${score}/105`}
>
  {/* content */}
</div>
```

### After
```tsx
import { Tooltip } from '@/components/Tooltip';

<Tooltip content={`${tier} complexity — Score: ${score}/105`}>
  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    {/* content */}
  </div>
</Tooltip>
```

---

## Testing Checklist

After migration, verify:

- [ ] Tooltip appears on hover in light mode
- [ ] Tooltip appears on hover in dark mode
- [ ] Text is readable (high contrast) in light mode
- [ ] Text is readable (high contrast) in dark mode
- [ ] Tooltip positioning is correct (not cut off)
- [ ] Tooltip disappears when mouse leaves
- [ ] No console errors or warnings

---

## Notes

- The custom Tooltip component uses CSS variables from `app/globals.css`
- It respects the Farther brand color system
- Accessible by default (uses proper ARIA patterns)
- Works with any React element as children
- Automatically handles light/dark mode via Tailwind's `dark:` prefix

---

## Automated Migration Script (Future)

To automate migration across all files:

```bash
# Find all title attributes
rg 'title=' app/ components/ --type tsx > titles.txt

# Create a script to replace patterns (manual review recommended)
# This is a starting point - test thoroughly before mass replace
```

**Recommendation:** Migrate file-by-file with manual review to ensure each tooltip works correctly in context.
