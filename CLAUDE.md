# Farther AX Command Center — Claude Project Guide

## CRITICAL: Repository Boundaries

**This repository is ONLY for the AX Command Center.**

### What BELONGS in THIS Repo (Farther-AX)
✅ Advisor pipeline management (recruiting, acquisitions)
✅ Advisor onboarding workflows and task management
✅ Advisor profiles (`/command-center/advisor/[id]`)
✅ U4 & 2B intake forms (advisor compliance documents)
✅ Client transition management (DocuSign integration)
✅ RIA Hub (relationship intelligence & AI briefings)
✅ Complexity scoring for advisor assignments
✅ Team management and AXM workload balancing
✅ Advisor sentiment tracking
✅ Grok AI assistant for AX team

### What DOES NOT Belong Here
❌ Billing data, fee analysis, AUM analytics → **farther-billing-portal**
❌ Marketing content, social media, brand center → **Farther-Marketing**
❌ Wealth planning, tax optimization, PRISM → **Farther-Intelligent-Wealth-Tools**

---

## GitHub & Deployment

| Field | Value |
|-------|-------|
| **GitHub** | https://github.com/timbohnett-farther/Farther-AX |
| **Deploy** | Railway (Nixpacks, Node 18) — auto-deploys from `main` |
| **Local Path** | `C:\Users\tim\Projects\Farther-AX` |

---

## Tech Stack

Next.js 14.2, React 18, TypeScript 5.9, Tailwind CSS 3.4, Tremor React 3.18, SWR 2.4, NextAuth 4.24 (Google OAuth), Heroicons, HubSpot API, DocuSign API, Grok/xAI API.

**NO local database** — all data via HubSpot API.

---

## Styling Approach

- **Tailwind utilities** + design tokens (`lib/design-tokens.ts`)
- **Tremor React** components (`components/ui/`)
- **NO inline styles, NO CSS modules**
- Fonts: `font-serif` (ABC Arizona Text) for headers, `font-sans` (Fakt) for body

---

## Key Patterns

- All pages are `'use client'` components
- Data fetching via SWR: `const { data } = useSWR('/api/...', fetcher)`
- Sidebar navigation: `components/Sidebar.tsx` with `commandCenterItems` array
- Loading states: `<div className="shimmer h-24 rounded-xl" />`
- Page headers: `<h1 className="text-3xl font-bold text-charcoal font-serif mb-2">`

---

## Command to Return to Work

```bash
cd C:\Users\tim\Projects\Farther-AX
git pull origin main
npm install
npm run dev
```

---

## Reminder: Cross-Repo Communication

If you need to work on billing, marketing, or wealth tools features, **STOP** and switch to the appropriate repository. Do NOT implement those features here.
