# Farther AX - Claude Memory File

## Project Overview
- **App**: Farther AX Command Center — internal advisor management tool for Farther (RIA firm)
- **Stack**: Next.js 14.2, React 18, TypeScript 5.9, SWR 2.4, Tailwind CSS 3.4, Tremor React 3.18, PostgreSQL, NextAuth 4.24
- **Styling**: Tailwind utilities + design tokens (`lib/design-tokens.ts`) + Tremor components. NO inline styles, NO CSS modules.
- **Fonts**: Headers use `font-serif` = `'ABC Arizona Text', Georgia, serif`; Body uses `font-sans` = `'Fakt', system-ui, sans-serif`
- **All pages are `'use client'`** client components using SWR for data fetching
- **Deploy**: Railway (Nixpacks, Node 18)

## Branch
- **Working branch**: `claude/connect-repository-zPuMu`

## Architecture (Post-Tremor Migration)

### Design System
- **`lib/design-tokens.ts`** — Centralized colors, typography, formatting helpers (`formatCompactCurrency`, `formatPercent`, etc.)
- **`components/ui/`** — 9 Tremor-based components: `StatCard`, `StatusBadge`, `ProgressIndicator`, `MetricBar`, `ScoreBadge`, `DataCard`, `ChartContainer`, `FilterBar`, `TabGroup`
- **`tailwind.config.ts`** — Extended with custom colors (`bg-charcoal`, `text-teal`, `bg-cream`), glass effects, animations
- **`app/globals.css`** — Glass-morphism classes (`.glass-card`, `.stat-card`), shimmer loading, depth shadows

### Key Patterns
- **NO inline styles** — Use Tailwind classes: `bg-cream`, `text-charcoal`, `text-slate`, `text-teal`, `transition-smooth`
- **SWR fetcher**: `const fetcher = (url: string) => fetch(url).then(r => r.json())`
- **Page header**: `<h1 className="text-3xl font-bold text-charcoal font-serif mb-2">Title</h1>`
- **Loading**: `<div className="shimmer h-24 rounded-xl" />`
- **Sidebar**: `/components/Sidebar.tsx` — `commandCenterItems` array with `{ label, href, icon }` format
- **Heroicons**: Use `@heroicons/react/24/outline` for icons

### Command Center Structure
```
app/command-center/
  page.tsx              — Pipeline dashboard (Recruiting + Acquisitions tabs)
  layout.tsx            — Shared layout with sidebar
  advisor/[id]/page.tsx — Individual advisor detail (tabbed)
  advisor-hub/page.tsx  — Advisor Hub with sentiment scoring
  onboarding/page.tsx   — Onboarding tasks & workload
  complexity/page.tsx   — Complexity scoring guide
  transitions/page.tsx  — Client transition tracking + DocuSign
  ai/page.tsx           — AI assistant (Grok)
  team/page.tsx         — Team management
  metrics/page.tsx      — Metrics dashboard
  ria-hub/page.tsx      — RIA Hub (relationship intelligence)
```

### API Routes
```
app/api/command-center/
  deals/route.ts             — HubSpot pipeline deals
  deal/[id]/route.ts         — Single deal detail + notes
  metrics/route.ts           — AUM & pipeline aggregations
  checklist/route.ts         — Onboarding task CRUD
  team/route.ts              — Team member management
  complexity/batch/route.ts  — Complexity scoring
  workload/route.ts          — AXM workload balancing
  staff-recommendation/route.ts
  advisor-hub/route.ts       — Advisor pipeline + sentiment
  sentiment/score/route.ts   — Single sentiment scoring
  sentiment/batch/route.ts   — Batch sentiment scoring
  sentiment/scores/route.ts  — Pre-computed scores
  aum-tracker/route.ts       — AUM via Managed Accounts
  transitions/route.ts       — Transition status tracking
  transitions/docusign/route.ts
  transitions/sync/route.ts  — Google Sheets sync
  ria-hub/route.ts           — Enriched deal data (Steps 6-7)
  ria-hub/summary/route.ts   — AI summaries via Grok
  ria-hub/email/route.ts     — Email templates + HubSpot send
  ria-hub/drive-link/route.ts — Drive folder link CRUD
```

### RIA Hub Feature
- **Page**: `/command-center/ria-hub/page.tsx` — Relationship intelligence for advisors in onboarding
- **Features**: Expandable advisor cards, AI briefings (4 types), email composer (6 templates), drive link manager
- **Uses**: Tremor components (`Card`, `Badge`, `Text`, `Metric`), design tokens, shared UI components (`StatCard`, `DataCard`, `FilterBar`, `TabGroup`, `StatusBadge`)

### DB Migration
`scripts/migrate.ts` includes `advisor_drive_links` table (used by RIA Hub drive link feature)
