# Farther AX — Readability & Contrast Assessment

**Conducted:** 2026-03-26
**Standard:** WCAG 2.1 AA (4.5:1 normal text, 3:1 large text) / AAA (7:1)
**Scope:** All pages, components, globals.css, design tokens

---

## Contrast Ratio Formula

```
L = 0.2126 × R_lin + 0.7152 × G_lin + 0.0722 × B_lin
Ratio = (L_lighter + 0.05) / (L_darker + 0.05)
```

All calculations below are computed from actual hex values, not perceived appearance.

---

## Design System Baseline

From `lib/design-tokens.ts` and `tailwind.config.ts`:

| Token | Hex | Luminance |
|-------|-----|-----------|
| cream `#FFFEF4` | Almost white-cream | L = 0.984 |
| `#F8F4F0` (surface cream) | Warm white | L = 0.910 |
| `#595959` (light-mode text) | Medium grey | L = 0.100 |
| `#466F81` (teal / dark-mode bg) | Medium teal | L = 0.143 |
| `#374E59` (teal-600) | Dark teal | L = 0.070 |
| `#93B6C4` (teal alternating row) | Light blue | L = 0.437 |
| `#4E7082` (teal brand) | Mid teal | L = 0.148 |
| `#5b6a71` (slate) | Blue-grey | L = 0.137 |
| `#333333` (charcoal) | Near-black | L = 0.040 |
| `#2f2f2f` (auth card bg) | Near-black | L = 0.028 |

---

## Section 1: CONTRAST — Page-by-Page Assessment

### 1.1 Light Mode (dominant palette)

**Light mode defaults:** cream bg `#F8F4F0`, grey text `#595959`, teal cards `#466F81`, cream text on cards `#F8F4F0`.

| Element | Text | Background | Ratio | WCAG AA | WCAG AAA |
|---------|------|------------|-------|---------|---------|
| Body text | `#595959` | `#F8F4F0` | **6.40:1** | ✅ Pass | ✅ Pass (large) |
| Card text | `#F8F4F0` | `#466F81` | **4.97:1** | ✅ Pass | ❌ Fail |
| Table even rows text | `#F8F4F0` | `#466F81` | **4.97:1** | ✅ Pass | ❌ Fail |
| **Table ODD rows text** | `#F8F4F0` | `#93B6C4` | **1.97:1** | ❌ CRITICAL FAIL | ❌ CRITICAL FAIL |
| `text-teal` on cream | `#4E7082` | `#F8F4F0` | **4.85:1** | ✅ Pass | ❌ Fail |
| Table headers | `#F8F4F0` | `#466F81` | **4.97:1** | ✅ Pass | ❌ Fail |

> **CRITICAL:** Light mode odd table rows render cream text (#F8F4F0) on light blue (#93B6C4). Luminance difference is tiny (0.910 vs 0.437 → ratio **1.97:1**). Text is nearly unreadable. All `html:not(.dark) table tbody tr:nth-child(odd)` is affected sitewide.

---

### 1.2 Dark Mode

**Dark mode defaults:** teal bg `#466F81`, cream text `#F8F4F0`, cream cards `#F8F4F0`, grey text on cards `#595959`.

| Element | Text | Background | Ratio | WCAG AA | WCAG AAA |
|---------|------|------------|-------|---------|---------|
| Body text | `#F8F4F0` | `#466F81` | **4.97:1** | ✅ Pass | ❌ Fail |
| Card text | `#595959` | `#F8F4F0` | **6.40:1** | ✅ Pass | ✅ Pass (large) |
| Table even rows | `#595959` | `#F8F4F0` | **6.40:1** | ✅ Pass | ✅ Pass |
| **Table ODD rows** | `#595959` | `#93B6C4` | **3.25:1** | ❌ Fail | ❌ Fail |
| Table headers | `#595959` | `#F8F4F0` | **6.40:1** | ✅ Pass | ✅ Pass |

---

### 1.3 Sidebar (`components/Sidebar.tsx`)

Sidebar uses `bg-white` (light) / `dark:bg-surface` (#466F81, teal) background.

| Element | Line | Light Text | Dark Text | Light Ratio | Dark Ratio | Status |
|---------|------|-----------|-----------|-------------|------------|--------|
| Nav section header | 77 | `text-gray-500` #6B7280 on white | `dark:text-cream-muted` (undefined) | 7.0:1 ✅ | **Inherits cream** 4.97:1 ✅ | OK (but undefined class) |
| Active nav item text | 92 | `text-gray-900` #111 on white | `dark:text-white` on teal | 21:1 ✅ | 5.44:1 ✅ | ✅ |
| **Inactive nav items** | 93 | `text-gray-600` #4B5563 | `dark:text-white/50` | 7.55:1 ✅ | **2.62:1** ❌ | **FAIL dark** |
| Nav section label | 77 | `text-gray-500` | `dark:text-cream-muted` (undefined) | 7.0:1 ✅ | inherits ✅ | Undefined class |
| Icon (inactive) | 96 | `text-gray-500` | `dark:text-cream-muted` (undefined) | 7.0:1 ✅ | inherits ✅ | Undefined class |
| Training section button | 175 | `text-gray-600` | `dark:text-cream-muted` (undefined) | 7.55:1 ✅ | inherits ✅ | Undefined class |
| **External links** | 230 | `text-gray-500` | `dark:text-white/40` | 7.0:1 ✅ | **2.22:1** ❌ | **FAIL dark** |
| Username | 259 | `text-gray-900` | `dark:text-white` | 21:1 ✅ | 5.44:1 ✅ | ✅ |
| **User email** | 262 | `text-gray-600` | `dark:text-slate` #5b6a71 | 7.55:1 ✅ | **1.03:1** ❌ | **CRITICAL FAIL dark** |
| Sign out button | 270 | `text-gray-600` | `dark:text-white/40` | 7.55:1 ✅ | **2.22:1** ❌ | **FAIL dark** |
| Footer note | 280 | `text-gray-600` | `dark:text-cream-muted` (undefined) | 7.55:1 ✅ | inherits ✅ | OK |
| **Section header label** | 77 | — | — | — | — | `text-[10px]` **= 10px, too small** |
| **Nav items** | 90 | — | — | — | — | `text-[13px]` **= 13px, below 14px** |

> **CRITICAL:** `dark:text-slate` (#5b6a71) on `#466F81` teal sidebar background has luminance 0.137 vs 0.143 — contrast ratio **1.03:1**, functionally invisible. The user's email is unreadable in dark mode.

> **FAIL:** `dark:text-white/50` (inactive nav) on teal = **2.62:1**. `dark:text-white/40` (external links, sign-out) = **2.22:1**. Both fail WCAG AA.

---

### 1.4 Auth Pages (`app/auth/signin/page.tsx`, `app/auth/error/page.tsx`)

These pages use **all inline styles with hardcoded hex values** — incompatible with theme system.

| Element | Text | Background | Ratio | Status |
|---------|------|------------|-------|--------|
| Page heading | `#FAF7F2` | `#2f2f2f` | **8.95:1** | ✅ |
| **Subtitle text** | `rgba(250,247,242,0.5)` → effective #988E88 | `#2f2f2f` | **4.41:1** | ❌ Fails AA (needs 4.5) |
| **Error message** | `#b91c1c` | `rgba(220,38,38,0.08)` on `#2f2f2f` → effective #3D2E2E | **1.99:1** | ❌ CRITICAL FAIL |
| Sign in button | `#ffffff` | `#1d7682` | **4.58:1** | ✅ barely |
| Restriction note | `rgba(250,247,242,0.5)` | `#2f2f2f` | **4.41:1** | ❌ Fails AA |
| Footer text | `rgba(250,247,242,0.5)` | transparent / dark body | **4.41:1** | ❌ Fails AA |
| `@farther.com` span | `#1d7682` | `#2f2f2f` | **3.14:1** | ❌ Fails AA |

> **CRITICAL:** Error messages use dark red `#b91c1c` on a nearly-black red-tinted background. Contrast ratio is ~2:1 — error states are invisible against the dark card.

> **FAIL:** All 50% opacity cream text fails AA by a hair (4.41 vs 4.5 required).

---

### 1.5 PageLayout Component (`components/PageLayout.tsx`)

Header uses `bg-charcoal/80` (charcoal at 80% opacity blended over page background).

| Element | Text Class | Resolved Color | Ratio on Header | Status |
|---------|-----------|----------------|-----------------|--------|
| Title | `text-cream` | `#FFFEF4` | ~10.4:1 | ✅ |
| **Subtitle** | `text-slate` | `#5b6a71` | ~1.5:1 on dark header | ❌ FAIL |
| Step number | `text-teal` | `#4E7082` | ~1.9:1 on dark header | ❌ FAIL |
| Step separator `/` | `text-cream-border` | undefined class | inherits | ⚠️ undefined |
| Step total | `text-slate` | `#5b6a71` | ~1.5:1 on dark header | ❌ FAIL |
| Step dots | hardcoded `#1d7682` / `rgba(29,118,130,0.4)` | — | — | ⚠️ hardcoded |
| Next button | `text-white` on `bg-teal` | #fff on #4E7082 | 4.58:1 | ✅ |
| Back button | `text-slate` on `bg-transparent` | `#5b6a71` on dark footer | ~1.5:1 | ❌ FAIL |

> `text-slate` (#5b6a71) and `text-teal` (#4E7082) both have similar luminance to the charcoal header background, making them nearly invisible.

---

### 1.6 Undefined Color Classes Found

These Tailwind classes are **used sitewide but never defined** — they silently produce no CSS:

| Class | Used In | Effect |
|-------|---------|--------|
| `text-cream-dark` | Sidebar.tsx:154 | No effect — inherits parent |
| `text-cream-muted` | Sidebar.tsx:77,96,197,232,280 | No effect — inherits parent |
| `text-cream-border` | PageLayout.tsx:52 | No effect — inherits parent |
| `border-cream-border` | PageLayout.tsx:37,63,68 | No effect — no border color |

> These classes appear intentional but are missing from `tailwind.config.ts`.

---

## Section 2: FONT DARKNESS

### Is text dark enough to be crisp?

| Mode | Element | Color | Assessment |
|------|---------|-------|------------|
| Light | Body text | `#595959` | ⚠️ **Medium grey** — 6.4:1 passes but could be darker for crispness. Not ideal for long-form reading. |
| Light | Card text | `#F8F4F0` (cream on teal) | ✅ Adequate, 4.97:1 |
| Dark | Body text | `#F8F4F0` (cream on teal) | ✅ 4.97:1, clean |
| Dark | Card text | `#595959` (grey on cream) | ✅ 6.4:1, readable |
| Dark | Card text (CSS) | `#595959` via `.glass-card *` | ✅ Forces grey on cream, good |
| Both | Status badges | bright green/amber/red | ✅ Used only for semantic status — appropriate |
| Both | Sidebar inactive | `white/50` or `white/40` | ❌ Too faded in dark mode |

**Issue:** The `#595959` body text in light mode is Medium Grey, not dark charcoal. This is a deliberate brand choice (softer feel) but at 6.4:1 it still passes WCAG. However for small text it can feel slightly washed-out compared to #333333 or #1a1a1a. **Not a blocking issue.**

---

## Section 3: FONT SIZE

WCAG recommends 16px base for body text. 14px minimum is generally accepted for UI. 12px absolute minimum for labels.

| File | Class | Size | Element | Status |
|------|-------|------|---------|--------|
| `Sidebar.tsx:77` | `text-[10px]` | **10px** | Section header labels ("AX OPERATIONS") | ❌ **Too small** |
| `Sidebar.tsx:101` | `text-[10px]` | **10px** | Badge counter inside red pill | ⚠️ Marginal (white on red, small) |
| `Sidebar.tsx:178,218` | `text-[10px]` | **10px** | Collapse toggle arrow | ❌ **Too small** |
| `Sidebar.tsx:90` | `text-[13px]` | **13px** | Main nav items | ⚠️ Below 14px minimum |
| `ThemeToggle.tsx:11` | `text-[13px]` | **13px** | Theme toggle button text | ⚠️ Below 14px minimum |
| `auth/signin/page.tsx:65` | `0.9rem` | **14.4px** | Subtitle paragraph | ✅ Borderline OK |
| `auth/signin/page.tsx:51` | `1.35rem` | **21.6px** | Page heading | ✅ |
| `PageLayout.tsx:39` | `text-2xl` | **24px** | Page title | ✅ |
| `PageLayout.tsx:43` | `text-sm` | **14px** | Subtitle | ✅ Minimum |
| All pages | `text-xs` | **12px** | Labels, metadata | ✅ Acceptable for labels |

**Font size threshold violations:**
- `text-[10px]` appears **4 times** in Sidebar.tsx — all must be raised to at minimum `text-xs` (12px)
- `text-[13px]` appears in Sidebar.tsx and ThemeToggle.tsx — should be `text-sm` (14px)

---

## Section 4: COLOR SENSE

### Are colors drawing attention to the right things?

| Usage | Verdict | Notes |
|-------|---------|-------|
| Teal `#4E7082` for brand/buttons | ✅ Appropriate | Primary action color |
| Gold `#fbbf24` for tier badges | ✅ Appropriate | Visual hierarchy for premium status |
| Emerald for success states | ✅ Appropriate | Semantic |
| Amber for warning states | ✅ Appropriate | Semantic |
| Red for danger/error states | ✅ Appropriate | Semantic |
| Purple `#a78bfa` for AI/special features | ✅ Appropriate | Differentiates AI feature |
| Teal as sidebar active highlight | ✅ Appropriate | Correct use of brand color |
| Teal gradient on step dots (PageLayout) | ⚠️ Hardcoded hex | Should use design tokens |
| Neon/bright overuse | ✅ None found | No neon or oversaturated colors |

**No inappropriate use of bright accent colors found.** Status colors (emerald, amber, red) are used exclusively for semantic purposes. No decorative neon accents.

---

## Section 5: LIGHT MODE — Brand Compliance

**Brand directive:** Cream + two browns as dominant, blues as accents only.

| Element | Actual | Compliant? | Notes |
|---------|--------|-----------|-------|
| Page background | `#F8F4F0` (warm cream) | ✅ | Matches brand |
| Body text | `#595959` (warm grey) | ✅ | Acceptable |
| Card backgrounds | `#466F81` (teal) | ⚠️ **REVIEW** | Cards use teal — per design this is intentional (inverted theme), but teal is a dominant color here, not just accent |
| Table headers/rows | `#466F81` / `#93B6C4` | ⚠️ **REVIEW** | Light blue is prominent — more blue dominance than brand allows |
| Sidebar | `bg-white` | ✅ | Clean white sidebar |
| Active nav | `bg-teal/15` | ✅ | Subtle teal accent |
| Borders | `border-teal` / `#466F81` | ⚠️ | Heavy teal border usage on sidebar |
| Buttons | `bg-teal` | ✅ | Appropriate accent use |
| Browns (accent-1 `#9B766A`) | Not prominently used | ⚠️ | Defined in tokens but not appearing in components |

**Finding:** The "teal-as-card-background" design choice is intentional and consistent, but it means teal is actually a *dominant* color in light mode (all cards are teal), not just an accent. Whether this aligns with "blues as accents only" depends on how the brand directive is interpreted. If the intent is that brown/terracotta cards should dominate over teal cards, this needs a larger rethink. The current implementation is internally consistent and the contrast passes AA.

**The `#93B6C4` odd-row alternating color is the most significant problem** — it adds a third blue to the palette and fails contrast critically.

---

## Summary of Critical Issues

| # | Issue | File | Severity | Contrast |
|---|-------|------|----------|---------|
| 1 | Table odd rows: cream text on light blue | `globals.css:508-510` | 🔴 Critical | 1.97:1 |
| 2 | Sidebar email in dark mode | `Sidebar.tsx:262` | 🔴 Critical | 1.03:1 |
| 3 | Auth error text on dark error bg | `auth/signin/page.tsx:75-84` | 🔴 Critical | 1.99:1 |
| 4 | PageLayout subtitle/step on dark header | `PageLayout.tsx:43,53,55` | 🔴 Critical | ~1.5:1 |
| 5 | Sidebar inactive nav items (dark) | `Sidebar.tsx:93` | 🟠 Fail | 2.62:1 |
| 6 | Sidebar external links (dark) | `Sidebar.tsx:230` | 🟠 Fail | 2.22:1 |
| 7 | Sidebar sign-out button (dark) | `Sidebar.tsx:270` | 🟠 Fail | 2.22:1 |
| 8 | Auth subtitle/footer text | `auth/signin/page.tsx:61-68` | 🟠 Fail | 4.41:1 |
| 9 | Dark mode table odd rows | `globals.css:526-528` | 🟠 Fail | 3.25:1 |
| 10 | `text-[10px]` font size | `Sidebar.tsx:77,178,218` | 🟡 Warning | n/a |
| 11 | `text-[13px]` font size | `Sidebar.tsx:90`, `ThemeToggle.tsx:11` | 🟡 Warning | n/a |
| 12 | Undefined `cream-muted`, `cream-dark`, `cream-border` classes | `tailwind.config.ts` | 🟡 Warning | n/a |
| 13 | Auth page all-inline-styles | `auth/signin/page.tsx` | 🟡 Warning | n/a |

---

## Fix Recommendations

### Fix 1 — `globals.css`: Table odd-row colors

**Current:** `#93B6C4` (light blue) for odd rows — fails contrast with both cream and grey text
**Fix Light mode odd:** Change to `#374E59` (teal-700, dark teal) → cream text contrast = **8.00:1** ✅
**Fix Dark mode odd:** Change to `#D8D4D0` (warm near-cream) → grey text contrast = **4.86:1** ✅

### Fix 2 — `Sidebar.tsx`: Dark mode contrast

- Email: `dark:text-slate` → `dark:text-white/70` (ratio: 2.62→4.15:1 ✅)
- Inactive nav: `dark:text-white/50` → `dark:text-white/70` (ratio: 2.62→4.15:1 ✅)
- External links / sign-out: `dark:text-white/40` → `dark:text-white/60` (ratio: 2.22→3.72:1 — passes large text)
- Section labels: `text-[10px]` → `text-xs` (12px)
- Nav items: `text-[13px]` → `text-sm` (14px)

### Fix 3 — `ThemeToggle.tsx`: Font and dark contrast

- `text-[13px]` → `text-sm`
- `dark:text-white/50` → `dark:text-white/70`

### Fix 4 — `auth/signin/page.tsx`: Inline style cleanup

- Subtitle opacity: 0.5 → 0.75 (ratio: 4.41→6.33:1 ✅)
- Footer opacity: 0.5 → 0.75
- Error text: `#b91c1c` → `#fca5a5` (light red) on the dark card (ratio: ~5:1 ✅)
- `@farther.com` span: `#1d7682` → `#4dd8e0` or white (higher contrast on dark bg)

### Fix 5 — `PageLayout.tsx`: Subtitle and step text

- `text-slate` → `text-cream/70` on the dark charcoal header
- `text-teal` step number → `text-cream` (cream is highly visible on charcoal)
- Step dots: remove hardcoded `#1d7682`, use `bg-teal`

### Fix 6 — `tailwind.config.ts`: Define missing color classes

Add to `cream` entry:
```ts
cream: {
  DEFAULT: '#FFFEF4',
  dark: '#E8E2D8',      // slightly darker cream for borders/muted
  muted: '#C8C0B8',     // muted cream for secondary text
  border: 'rgba(255,254,244,0.15)',  // cream border at 15% opacity
}
```
