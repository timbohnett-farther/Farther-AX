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

## NON-NEGOTIABLE RULES

These rules are absolute and must be followed at all times without exception.

### 1. AX Project Work Only — No Repo Switching
This repo is exclusively for AX Command Center work. While working on AX items, you **cannot** switch to another repository. If a task does not belong to AX, refuse it and inform the user which repo it belongs in. Do not attempt cross-repo work from here under any circumstances.

### 2. Update the CHANGELOG on Every Push
Every single push must include an updated `CHANGELOG.md` entry. No exceptions. Document what changed, why, which files were affected, and the commit SHA. This is not optional — a push without a CHANGELOG update is an incomplete push.

### 3. Maintain the TODO Log — Auto-Proceed Without Asking
`TODO.md` is the active task queue. When the user adds items (by saying "todo" or listing tasks), add them to `TODO.md` immediately. After completing any task, check `TODO.md` and **automatically proceed to the next item without asking permission**. Work through the list in priority order. Never ask "what's next?" if there are items on the TODO list.

### 4. Optimize End-User Experience at All Times
Always prioritize the end-user experience. This means:
- **Working connections** — every API call, link, and data source must function correctly
- **Accurate calculations** — all numbers, scores, and metrics must compute properly
- **Working pages** — no broken routes, no dead ends, no error states left unhandled
- **Fast load times** — load times kill user engagement. Optimize data fetching, use proper loading states, leverage SWR caching, and minimize unnecessary re-renders. Slow pages are unacceptable.

### 5. Follow the Brand Guide — Uniform Branding Everywhere
All pages must follow the Farther brand guide consistently. This includes:
- **Design tokens** from `lib/design-tokens.ts` — use them, don't hardcode colors or spacing
- **Typography** — `font-serif` (ABC Arizona Text) for headers, `font-sans` (Fakt) for body text
- **Tailwind utilities** only — no inline styles, no CSS modules
- **Tremor React** components for data visualization and UI elements
- **Consistent styling** across every page — no page should look different from the rest of the app

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

## Development Workflow

### 📋 TODO Management

**File:** `TODO.md` — Active task queue

**Rules:**
1. **Check TODO.md first** — Always check for pending tasks before starting new work
2. **Auto-proceed** — If tasks exist in TODO, work on them in order (highest priority first)
3. **Update status** — Mark tasks as 🟡 In Progress → ✅ Fixed → 🔵 Deployed
4. **Add new todos** — When user mentions "todo" or reports issues, add them to TODO.md immediately

**Priority Order:**
- 🚨 Critical (app broken)
- High (major feature down)
- Medium (minor issue, has workaround)
- Low (nice-to-have)

### 📝 CHANGELOG Updates

**File:** `CHANGELOG.md` — Keep historical record

**Rules:**
1. **Update after EVERY push** to main branch
2. **Format:** Date, What changed, Why, Files affected, Impact
3. **Be specific** — Include file paths, API endpoints, component names
4. **Link commits** — Reference commit SHAs for traceability

**Example Entry:**
```markdown
## [Completed] Fix Alerts Page — 2026-03-25

**What**: Fixed alerts API endpoint returning empty data

**Scope**:
- Updated API route to properly query database
- Added error handling for missing data
- Improved loading states

**Status**: ✅ Fixed and deployed

**Files**:
- `app/api/command-center/alerts/route.ts`
- `app/command-center/alerts/page.tsx`

**Commit**: `abc1234`
```

### 🔄 Git Workflow

1. Check TODO.md for pending tasks
2. Work on highest priority task
3. Test changes locally (`npm run dev`)
4. Update TODO.md status (✅ Fixed)
5. **Update CHANGELOG.md** with details
6. Commit with descriptive message
7. Push to main
8. Verify Railway deployment
9. Update TODO.md status (🔵 Deployed)
10. Proceed to next task in TODO.md

### ⚠️ Important Notes

- **Always work in Farther-AX folder only**
- **Never mix code from other projects**
- **Check TODO.md before asking "what's next?"**
- **Update CHANGELOG before pushing**

---

## Reminder: Cross-Repo Communication

If you need to work on billing, marketing, or wealth tools features, **STOP** and switch to the appropriate repository. Do NOT implement those features here.
