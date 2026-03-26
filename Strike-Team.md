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

### P0 Issues Found & Fixed

| # | Issue | Fix | File(s) |
|---|-------|-----|---------|
| | *(No P0 issues logged yet)* | | |

### P1 Issues Found & Fixed

| # | Issue | Fix | File(s) |
|---|-------|-----|---------|
| | *(No P1 issues logged yet)* | | |

### P2/P3 Backlog (Not Yet Fixed)

| # | Priority | Issue | Recommended Fix |
|---|----------|-------|-----------------|
| | | *(No backlog items logged yet)* | |

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

5. CODE QUALITY (CIPHER)
   |-- No duplicate definitions?
   |-- Structured error handling?
   |-- Env validation?
   +-- Type assertions minimized?

6. BUILD VERIFICATION (POST-AUDIT)
   |-- npm run build passes?
   |-- useSearchParams() wrapped in Suspense?
   |-- All imports present?
   |-- ESLint comments reference configured rules only?
   +-- No TypeScript literal type narrowing issues?
```

**Rule**: Step 6 (Build Verification) is MANDATORY. An audit is not complete until `npm run build` succeeds with zero export errors. Dev-mode testing (`next dev`) is insufficient — it skips static generation and hides framework constraints.
