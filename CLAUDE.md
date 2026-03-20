# Farther AX - Claude Memory File

## Project Overview
- **App**: Farther AX Command Center — internal advisor management tool for Farther (RIA firm)
- **Stack**: Next.js 14.2, React 18, TypeScript 5.9, SWR 2.4, Tailwind CSS 3.4, PostgreSQL, NextAuth 4.24
- **Styling**: Inline styles + design tokens (`C` object) + Tailwind for layout. NO CSS modules.
- **Fonts**: Headers use `'ABC Arizona Text', Georgia, serif`; Body uses `'Fakt', system-ui, sans-serif`
- **All pages are `'use client'`** client components using SWR for data fetching

## Branch
- **Working branch**: `claude/connect-repository-zPuMu`

## Current Task: Build RIA Hub Frontend
The RIA Hub has 4 complete API routes but NO UI page yet:

### Completed API Routes
1. **`/api/command-center/ria-hub/route.ts`** — Fetches enriched deal data from HubSpot (Advisor Recruiting pipeline 751770, Steps 6-7)
2. **`/api/command-center/ria-hub/summary/route.ts`** — Generates AI summaries via Grok (4 types: briefing, activities, emails, engagements)
3. **`/api/command-center/ria-hub/email/route.ts`** — 6 email templates + send via HubSpot (GET templates, POST to send)
4. **`/api/command-center/ria-hub/drive-link/route.ts`** — CRUD for Google Drive folder links (PostgreSQL table `advisor_drive_links`)

### What Needs Building
- [ ] RIA Hub page at `/app/command-center/ria-hub/page.tsx`
  - Advisor cards with deal info, contacts, recent activity
  - Tab layout: Briefing | Activities | Communications | Collaboration
  - AI summary panels consuming summary API
  - Email composer with template picker
  - Drive link manager
- [ ] Add "RIA Hub" to sidebar in `/components/Sidebar.tsx` (add to `commandCenterItems` array)
- [ ] Run migration for `advisor_drive_links` table (changes in `scripts/migrate.ts`)
- [ ] Commit and push all changes

### DB Migration Pending
`scripts/migrate.ts` has uncommitted changes adding the `advisor_drive_links` table:
```sql
CREATE TABLE IF NOT EXISTS advisor_drive_links (
  id SERIAL PRIMARY KEY,
  deal_id VARCHAR(64) NOT NULL UNIQUE,
  folder_url TEXT NOT NULL,
  folder_name VARCHAR(255) DEFAULT 'Advisor Folder',
  updated_by VARCHAR(255),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Key Patterns
- **Color tokens**: `const C = { dark: '#333333', white: '#ffffff', slate: '#5b6a71', teal: '#1d7682', bg: '#FAF7F2', cardBg: '#ffffff', border: '#e8e2d9', red: '#c0392b', amber: '#b27d2e', green: '#27ae60' }`
- **SWR fetcher**: `const fetcher = (url: string) => fetch(url).then(r => r.json())`
- **Sidebar**: `/components/Sidebar.tsx` — add to `commandCenterItems` array with `{ label, href, icon }` format
- **Existing pages**: Pipeline, Onboarding, Team, Metrics, Complexity, AI Assistant, Advisor Detail `[id]`

## Existing Command Center Structure
```
app/command-center/
  page.tsx           — Main pipeline dashboard (Recruiting + Acquisitions tabs)
  layout.tsx         — Shared layout with sidebar
  advisor/[id]/page.tsx — Individual advisor detail
  onboarding/page.tsx   — Onboarding tasks & workload
  complexity/page.tsx   — Complexity scoring
  ai/page.tsx          — AI assistant
  team/page.tsx        — Team management
  metrics/page.tsx     — Metrics dashboard
```
