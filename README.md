# Farther AX Command Center

Internal advisor management and CRM command center for Farther (RIA firm). Operational hub for the Advisory Experience (AX) team -- pipeline management, advisor onboarding, complexity scoring, client transitions, and relationship intelligence.

---

## Part of the Farther Platform

This is 1 of 4 interconnected Farther projects. Each is a standalone app today, designed to eventually unify into a single platform.

| Project | Repo | Purpose |
|---------|------|---------|
| **AX Command Center** (this) | `Farther-AX` | Advisor pipeline, onboarding, CRM operations |
| **Billing Portal** | `farther-billing-portal` | Billing analytics, BI dashboards, fee analysis |
| **Marketing Command Center** | `Farther-Marketing` | AI marketing ops, content creation, compliance |
| **Intelligent Wealth Tools** | `Farther-Intellegent-Wealth-Tools` | Financial planning, tax optimization, client portal |

**Integration points**: HubSpot is the shared CRM across AX, Billing, and Marketing. Advisor data flows from AX (pipeline/onboarding) to Billing (fee tracking) to Marketing (brand profiles). Wealth Tools serves the advisor-client relationship with planning tools.

---

## What Belongs in This Repo

| Yes | No |
|-----|-----|
| Pipeline management (deals, recruiting, acquisitions) | Billing data, BI analytics, fee analysis |
| Advisor profiles (`/command-center/advisor/[id]`) | Marketing content, social media, brand center |
| Onboarding tasks, workload, calendar generation | Wealth planning, tax optimization, portfolios |
| Advisor Hub (sentiment, engagement) | |
| Transitions (DocuSign, client transfers) | |
| RIA Hub (relationship intelligence, AI briefings) | |
| Complexity scoring | |
| Team management, metrics | |
| AI assistant (Grok) | |

## GitHub & Deployment

| Field | Value |
|-------|-------|
| **GitHub** | `https://github.com/timbohnett-farther/Farther-AX` |
| **Deploy** | Railway (Nixpacks) -- auto-deploys from `main` |
| **Branch** | `main` |

## Tech Stack

Next.js 14.2, React 18, TypeScript 5.9, Tailwind CSS 3.4, Tremor 3.18, SWR 2.4, Heroicons, NextAuth 4.24 (Google OAuth), HubSpot API, DocuSign, Grok/xAI. No local database -- all data via HubSpot API.

## Setup (Any Machine)

```bash
# Clone to ~/Projects (standard location for all Farther repos)
cd ~/Projects
git clone https://github.com/timbohnett-farther/Farther-AX.git
cd Farther-AX
npm install

# Create .env.local with: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
# NEXTAUTH_SECRET, NEXTAUTH_URL, HUBSPOT_ACCESS_TOKEN, XAI_API_KEY

npm run dev
```

**Returning to work:**
```bash
cd ~/Projects/Farther-AX && git pull origin main && npm install && npm run dev
```

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm start` | Production server |
| `npm run lint` | ESLint |

---

## Claude Code Session Rules

### Working Directory
Always work in `~/Projects/Farther-AX`. Never create alternative folders.

### Styling
Tailwind CSS utilities + design tokens (`lib/design-tokens.ts`). NO inline styles, NO CSS modules. All pages are `'use client'` with SWR for data fetching. Icons: `@heroicons/react/24/outline`.

### Session Continuity Protocol

**Every session must feel like a continuation, not a restart.**

1. **Read `CLAUDE.md` first** -- it contains architecture, patterns, and project state
2. **Read `CHANGELOG.md`** before starting work -- know what was built recently
3. **When starting a new feature**: Add a scope entry to `CHANGELOG.md` with the feature name, date started, and planned scope. This way if the session ends mid-work, the next session knows exactly where to pick up
4. **When completing work**: Update `CHANGELOG.md` with what was done
5. **Always push to `main`** after completing work -- Railway auto-deploys

### Changelog Format

Maintain `CHANGELOG.md` in the repo root:

```markdown
## [In Progress] Feature Name — Started YYYY-MM-DD
**Scope**: What this feature does and what's planned
**Status**: What's done / what's remaining
**Files touched**: List of key files modified or created

## [Completed] Feature Name — YYYY-MM-DD
**What**: Brief description of what was built
**Files**: Key files added/modified
```

This ensures any Claude Code session on any machine can pick up exactly where the last one left off.
