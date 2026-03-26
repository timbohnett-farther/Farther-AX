# Strike Team Pre-Launch Audit Framework

**Project**: Farther AX Command Center
**Last Audit**: 2026-03-26
**Deploy Target**: Railway (Nixpacks, Node 18) — auto-deploys from `main`

---

## Audit Specialists

| Codename | Domain | Focus |
|----------|--------|-------|
| **AXIOM** | Security | Auth flows (NextAuth/Google OAuth), middleware, session handling, data exposure |
| **RAIL** | Infrastructure | HubSpot API connections, DocuSign integration, external API timeouts, error handling |
| **DATUM** | Data Integrity | HubSpot data validation, input sanitization, NaN guards, type safety |
| **NEXUS** | Frontend/UX | Responsive design, accessibility, hydration, brand guide compliance, load times |
| **CIPHER** | Code Quality | Deduplication, type assertions, logging, env validation |
| **PRISM** | Brand Consistency | Color tokens, font compliance, card/table/graph uniformity across all pages |

---

## Severity Levels

| Level | Definition | Action |
|-------|-----------|--------|
| **P0** | Launch blocker. Security vulnerability or build failure. | Fix immediately. Do not deploy until resolved. |
| **P1** | High priority. Functional bug, missing auth, data leak risk. | Fix before next deploy. |
| **P2** | Medium. UX issue, missing error boundary, accessibility gap. | Fix within current sprint. |
| **P3** | Low. Code smell, refactor opportunity, nice-to-have. | Backlog. |

---

## Pre-Push Checklist

Every push MUST pass ALL of these checks. A failure at any step means **do not push**.

### 1. Build Verification

```bash
npm run build
```

- [ ] TypeScript compilation succeeds (`tsc --noEmit` equivalent via `next build`)
- [ ] ESLint passes with zero errors (warnings are acceptable)
- [ ] Static page generation completes without export errors
- [ ] No `Export encountered errors on following paths` in output

### 2. Next.js 14 Framework Constraints

These are **build-time constraints** that do NOT surface during `next dev`. They only fail during `next build` (production static generation). The audit must check for these explicitly.

#### useSearchParams() Requires Suspense Boundary

Any `'use client'` page that calls `useSearchParams()` MUST wrap its content in `<Suspense>`.

**Pattern**:
```tsx
'use client';

import { Suspense } from 'react';

function PageContent() {
  const searchParams = useSearchParams(); // This needs Suspense
  // ... page content
}

export default function Page() {
  return <Suspense><PageContent /></Suspense>;
}
```

**Why**: Next.js 14 attempts to statically prerender all pages. `useSearchParams()` is a client-only API that cannot run during server-side static generation. The `<Suspense>` boundary tells Next.js to defer that subtree.

**Important**: `export const dynamic = 'force-dynamic'` does NOT work in `'use client'` files. It is ignored. Only `<Suspense>` wrapping fixes this.

#### API Routes Using headers()/cookies() Log Errors During Build

API routes that call `headers()` (e.g., via auth) will log errors like:
```
Dynamic server usage: Route /api/foo couldn't be rendered statically because it used `headers`
```
These are **not real errors**. Next.js detects the dynamic usage, marks the route as server-rendered, and moves on. The build succeeds. Do not try to "fix" these.

### 3. TypeScript Gotchas

#### Literal Type Narrowing
When assigning a design token value to a `let` variable, TypeScript narrows the type to the literal string instead of `string`. If the variable is later reassigned, it fails.

**Fix**: Explicitly type as `string`:
```typescript
let color: string = designTokens.colors.steel;
```

#### NextAuth Session Type Conflicts
NextAuth's `User.id` is typed as `string`. AX may use different ID formats from HubSpot. Direct assignment can cause type errors.

**Fix**: Use `Object.assign` instead of direct property assignment:
```typescript
// Bad: session.user.id = token.hubspotId;
// Good:
Object.assign(session.user, { id: token.hubspotId });
```

#### Component Prop Name Mismatches
When multiple callers use a different prop name than the component declares, accept both:
```typescript
interface Props {
  direction?: Direction;
  trend?: Direction; // Alias for backward compatibility
}
function Badge({ direction, trend }: Props) {
  const resolved = direction ?? trend ?? 'default';
}
```

### 4. ESLint Configuration

- The project does **NOT** include `@typescript-eslint` plugin
- Never use `// eslint-disable-next-line @typescript-eslint/*` comments — they cause build failures because ESLint treats references to unconfigured rules as errors
- Only use ESLint disable comments for rules that are actually configured (e.g., `react-hooks/exhaustive-deps`)

### 5. Security Checks

- [ ] **Auth middleware is enabled** — middleware must NOT have a blanket bypass
- [ ] **Dev bypass is gated** — any dev fallback only runs when `NODE_ENV === 'development'`
- [ ] **No error leakage** — All API `catch` blocks return generic `'Internal server error'` to clients, log details server-side
- [ ] **No injection vectors** — All dynamic values in HubSpot API calls are properly sanitized
- [ ] **Input validation** — All routes accepting user params validate and sanitize input
- [ ] **Auth before API calls** — Every API route checks auth BEFORE making HubSpot/DocuSign/Grok API calls
- [ ] **No secrets in client code** — API keys for HubSpot, DocuSign, and xAI stay server-side only
- [ ] **No unused env vars** — `.env.example` only lists variables the app actually uses

### 6. Styling Compliance

- [ ] All colors come from design tokens (`lib/design-tokens.ts`) — no hardcoded hex values
- [ ] Tailwind utilities only — **no inline styles, no CSS modules**
- [ ] Tremor React components used for data visualization and UI elements (`components/ui/`)
- [ ] Typography follows brand guide: `font-serif` (ABC Arizona Text) for headers, `font-sans` (Fakt) for body
- [ ] Page headers use: `<h1 className="text-3xl font-bold text-charcoal font-serif mb-2">`
- [ ] Loading states use shimmer pattern: `<div className="shimmer h-24 rounded-xl" />`
- [ ] No old/off-brand palette colors anywhere

### 7. Infrastructure

- [ ] HubSpot API calls have proper error handling and timeouts
- [ ] DocuSign API calls have proper error handling and timeouts
- [ ] Grok/xAI API calls have timeout (AbortController recommended)
- [ ] SWR caching configured properly for optimal load times
- [ ] Health check endpoint returns appropriate status
- [ ] All external API integrations handle rate limiting gracefully

---

## Discovered Issues Log

### P0 Issues Found (2026-03-26 Audit)

| # | Issue | Status | File(s) |
|---|-------|--------|---------|
| 1 | **Font conflict**: Codebase uses ABC Arizona Text + Fakt but Font Gold Standard mandates Inter + DM Mono. No pages use Inter. | Open | `globals.css`, `design-tokens.ts`, all pages |
| 2 | **Duplicate light mode CSS**: Light mode overrides defined twice in globals.css (media query AND :root:not(.dark)) | Open | `app/globals.css` lines 134-204 |

### P1 Issues Found (2026-03-26 Audit)

| # | Issue | Status | File(s) |
|---|-------|--------|---------|
| 1 | **13 playbook pages completely disconnected from design system** — none import theme-colors or design-tokens, all use hardcoded hex colors (#1d7682, #2f2f2f, #FAF7F2, etc.) | Open | All `app/*/page.tsx` playbook pages |
| 2 | **Transitions page 70% compliance** — heavy inline styles, no serif fonts on headings, no DataCard wrappers, hardcoded colors | Open | `app/command-center/transitions/page.tsx` |
| 3 | **AI Assistant page 70% compliance** — does not import getThemeColors, uses glass-card class directly with hardcoded Tailwind colors | Open | `app/command-center/ai/page.tsx` |
| 4 | **RIA Hub page 72% compliance** — mixes Tremor Card with DataCard, partial theme-colors usage, hardcoded rgba() values | Open | `app/command-center/ria-hub/page.tsx` |
| 5 | **No shimmer loading states on 7/8 command center pages** — only RIA Hub implements shimmer, all others show "Loading..." text or nothing | Open | All command-center subpages except ria-hub |
| 6 | **No tabular-nums anywhere** — zero pages use `font-variant-numeric: tabular-nums` for financial numbers | Open | All pages with numeric data |
| 7 | **Sidebar light mode colors wrong** — uses bg-charcoal-800 (#1a1a1a dark) in light mode instead of cream | Open | `components/Sidebar.tsx` |
| 8 | **Glass card CSS hardcodes colors** — rgba(23,31,39,0.80) and rgba(212,223,229,0.16) not referencing CSS variables or tokens | Open | `app/globals.css` lines 312-325 |
| 9 | **3 conflicting color systems** — globals.css CSS variables, design-tokens.ts exports, and theme-colors.ts function all define colors with different naming conventions | Open | `globals.css`, `design-tokens.ts`, `theme-colors.ts` |
| 10 | **Missing Tailwind color definitions** — Sidebar uses text-cream, text-cream-muted, bg-teal/15 etc. that aren't in tailwind.config.ts | Open | `components/Sidebar.tsx`, `tailwind.config.ts` |

### P2/P3 Backlog (2026-03-26 Audit)

| # | Priority | Issue | Recommended Fix |
|---|----------|-------|-----------------|
| 1 | P2 | Complexity page uses Tailwind color classes directly instead of theme-colors C object (82% compliance) | Import getThemeColors, replace hardcoded Tailwind colors |
| 2 | P2 | Metrics page imports design-tokens but not theme-colors (80% compliance) | Import getThemeColors for consistency |
| 3 | P2 | Tremor integration colors defined in both globals.css and tailwind.config.ts with no clear precedence | Consolidate to single source |
| 4 | P2 | Gradient bull/bear colors in globals.css don't match design-tokens.ts primary values | Align gradient stops with token values |
| 5 | P3 | ThemeProvider doesn't programmatically update CSS variables, relies on class toggle | Consider direct CSS variable updates for reliability |
| 6 | P3 | No error.tsx files for route-level error boundaries | Add error.tsx to each route segment |
| 7 | P3 | Sortable table headers lack keyboard accessibility | Add tabIndex + onKeyDown handlers |

---

## PRISM Brand Consistency Audit (2026-03-26)

### Page Compliance Scores

**Reference**: Pipeline page (`app/command-center/page.tsx`) = 100%

#### Command Center Pages

| Page | Theme Colors | Cards | Tables | Fonts | Hardcoded Colors | Shimmer | tabular-nums | Score |
|------|-------------|-------|--------|-------|-----------------|---------|-------------|-------|
| Pipeline (Gold Std) | Full | Styled | Themed | Serif | Minimal | No | No | **100%** |
| Team | Full | DataCard | Themed | Serif | Minimal | No | No | **88%** |
| Onboarding | Full | DataCard | Themed | Serif | Minimal | No | No | **85%** |
| Alerts | Full | DataCard | Themed | Serif | Minimal | No | No | **85%** |
| Complexity | Partial | DataCard | N/A | Serif | Minimal | No | N/A | **82%** |
| Metrics | Partial | StatCard | Inline | Serif | Minimal | No | Yes | **80%** |
| RIA Hub | Partial | Mixed | Mixed | Serif | Moderate | Yes | Partial | **72%** |
| Transitions | Yes | Inline | Inline | No Serif | Moderate | No | Yes | **70%** |
| AI Assistant | None | glass-card | N/A | Serif | Moderate | No | N/A | **70%** |

#### Playbook Pages (13 pages)

| Page | Theme Colors | Cards | Fonts | Hardcoded Colors | Score |
|------|-------------|-------|-------|-----------------|-------|
| Introduction | None | glass-card class | Serif | Heavy | **45%** |
| Onboarding vs Transitions | Partial | glass-card-dark | Serif | Heavy | **40%** |
| Key Documents | None | glass-card | Serif | Heavy | **35%** |
| M&A | None | glass-card mixed | Serif | Heavy | **35%** |
| Calendar Generator | None | Inline | Serif | Heavy | **30%** |
| Knowledge Check | None | Inline | Serif | Heavy | **30%** |
| Breakaway | None | Inline | Serif | Heavy | **25%** |
| Independent RIA | None | Inline | Serif | Heavy | **25%** |
| No to Low AUM | None | Inline | Serif | Heavy | **25%** |
| Breakaway Process | None | Inline | Serif | Heavy | **25%** |
| LPOA | None | Inline | Serif | Heavy | **25%** |
| Master Merge | None | Inline | Serif | Heavy | **20%** |
| Repaper/ACAT | None | Inline | Serif | Heavy | **20%** |

### Common Hardcoded Colors Found Across Playbook Pages

| Color | Hex | Should Be |
|-------|-----|-----------|
| Gold/Teal | `#1d7682` | `C.teal` or design token |
| Cream text | `#FAF7F2` | `C.cream` or `C.dark` |
| Card background | `#2f2f2f`, `#2a2a2a`, `#222222` | `C.cardBg` |
| Border | `rgba(250,247,242,0.08)` | `C.border` |
| Green | `#16A34A`, `#4ade80`, `#86EFAC` | `C.green` or status token |
| Red | `#DC2626`, `#f87171`, `#FCA5A5` | `C.red` or status token |
| Amber | `#F59E0B`, `#fbbf24` | `C.amber` or status token |

---

## Build Error Pattern Recognition

When the Railway build fails, check these patterns in order:

| Error Pattern | Cause | Fix |
|--------------|-------|-----|
| `Export encountered errors on following paths` | Page prerender failure | Check for `useSearchParams()` without Suspense |
| `Cannot find name` for design tokens | Missing import | Add import from `@/lib/design-tokens` |
| `Definition for rule '@typescript-eslint/*' was not found` | ESLint plugin not configured | Remove the disable comment, use alternative pattern |
| `Type 'X' is not assignable to type 'Y'` | TypeScript literal narrowing | Add explicit `: string` type annotation |
| `Property 'X' does not exist on type 'Y'` | Prop name mismatch | Check component interface matches all call sites |
| `Dynamic server usage: Route couldn't be rendered statically` | API route uses `headers()` | **Not an error** — this is expected. Ignore. |

---

## Audit Execution Workflow

```
1. SECURITY SCAN (AXIOM)
   |-- Auth middleware enabled (NextAuth/Google OAuth)?
   |-- Dev bypass gated?
   |-- Error leakage?
   |-- API key exposure in client code?
   +-- Auth before external API calls?

2. INFRASTRUCTURE (RAIL)
   |-- HubSpot API error handling and timeouts?
   |-- DocuSign API error handling and timeouts?
   |-- Grok/xAI API timeouts?
   |-- SWR caching optimized?
   +-- Rate limiting handled?

3. DATA INTEGRITY (DATUM)
   |-- Input validation on all params?
   |-- NaN/undefined guards on calculations?
   |-- HubSpot data properly typed and validated?
   +-- Complexity scores computing correctly?

4. FRONTEND/UX (NEXUS)
   |-- Brand guide compliance (design tokens, typography)?
   |-- Tailwind only (no inline styles, no CSS modules)?
   |-- Tremor components for UI elements?
   |-- Fast load times (SWR, shimmer states)?
   |-- Responsive design?
   +-- Accessibility attributes?

5. BRAND CONSISTENCY (PRISM)
   |-- All pages use identical card styling (rounded-xl, shadow, padding)?
   |-- All tables follow same header/row/border pattern?
   |-- All colors from design tokens — no hardcoded hex?
   |-- Typography follows Font-Gold-Standard.md (Inter, DM Mono only)?
   |-- All financial numbers use tabular-nums + right-align?
   |-- Graph/chart color palettes consistent across all pages?
   |-- Page headers use uniform size/weight/font?
   |-- Loading states use shimmer pattern everywhere?
   |-- Pipeline page is the reference standard — all other pages must match?
   +-- No page looks visually different from the rest of the app?

6. CODE QUALITY (CIPHER)
   |-- No duplicate definitions?
   |-- Structured error handling?
   |-- Env validation?
   +-- Type assertions minimized?

7. BUILD VERIFICATION (POST-AUDIT)
   |-- npm run build passes?
   |-- useSearchParams() wrapped in Suspense?
   |-- All imports present?
   |-- ESLint comments reference configured rules only?
   +-- No TypeScript literal type narrowing issues?
```

**Rule**: Step 6 (Build Verification) is MANDATORY. An audit is not complete until `npm run build` succeeds with zero export errors. Dev-mode testing (`next dev`) is insufficient — it skips static generation and hides framework constraints.
