# Farther AX Command Center — Changelog

All notable changes to this project will be documented in this file.

Format: Each entry includes completion status, feature name, date, scope, status, and files touched.

---

## [Completed] Fix Metrics Cards Detail View — 2026-03-25

**What**: Implemented interactive detail views for all metrics cards. Clicking any StatCard now opens a slide-in panel with drill-down data and contextual information.

**Root Cause**:
- StatCard components supported onClick prop but no handlers were implemented
- No UI component existed to display detailed metric information
- Missing state management for tracking selected metrics

**Scope**:
- Added state management with `useState` to track selected metric
- Created slide-in detail panel component (slides in from right with backdrop)
- Added onClick handlers to 20+ StatCard components across 5 categories:
  - Team Capacity (4 cards): AX Staff, Platform AUM, Launched Advisors, AUM per Staff
  - Launched Advisor Stats (3 cards): Total Revenue, Avg Days to Launch, Total Households
  - Team Breakdown (4 cards): AXMs, AXAs, CTMs, CTAs
  - Onboarded AUM (3 cards): This Month, This Quarter, This Year
  - Upcoming Pipeline AUM (3 cards): Next 30/60/90 Days
- Detail panel features:
  - Responsive width (full on mobile, 1/2 on desktop)
  - Close button + backdrop click to dismiss
  - Formatted drill-down data (AUM formatted with `formatCompactCurrency`)
  - Contextual information boxes with calculation details and role descriptions
  - Smooth slide-in animation

**Status**: ✅ Fixed and deployed

**Files**:
- `app/command-center/metrics/page.tsx` — Added state, detail panel, onClick handlers to all StatCards

**Impact**:
- All 20+ metric cards now interactive with drill-down details
- Users can click any card to see breakdown of underlying data
- Improved UX with slide-in panel (non-blocking, easy to dismiss)
- Contextual help text explains calculations and team roles
- Maintains existing glass morphism design aesthetic

---

## [Completed] Fix Alerts Page Not Loading — 2026-03-25

**What**: Fixed critical bug where Alerts page was not displaying any data due to type mismatch between API response and frontend expectations.

**Root Cause**:
- API was returning `task_id` but frontend expected `task_key`
- Frontend expected `phase_label` field that wasn't being returned
- TaskAlert interface mismatch between route and page component

**Scope**:
- Updated TaskAlert interface in API route to match frontend expectations
- Changed `task_id` field to `task_key` in alert object
- Added `phase_label` field with proper phase name mapping
- Added PHASE_LABELS constant for phase_0 through phase_7 mapping

**Status**: ✅ Fixed and deployed

**Files**:
- `app/api/command-center/alerts/route.ts` — Updated TaskAlert interface and alert object creation

**Impact**:
- Alerts page now displays task overdue, sentiment drop, and AUM pace alerts correctly
- All alert types (task_overdue, task_critical, sentiment_drop, aum_behind) functioning properly
- Frontend can now properly render TaskAlertRow components with correct phase labels

---

## [Completed] Fix Onboarding Tasks Display — 2026-03-24

**What**: Fixed critical bug where tasks weren't loading in Advisor Hub due to phase mismatch between display code and task definitions.

**Scope**:
- Updated advisor detail page to use correct 8-phase structure (phase_0 through phase_7) instead of old 3-phase structure (pre_launch, launch_day, post_launch)
- Imported PHASE_META and PHASE_ORDER from lib/onboarding-tasks for consistent phase handling
- Updated ChecklistTask interface to use Phase type for type safety
- Added color-coded visual progression for all 8 phases

**Status**: ✅ Fixed and deployed

**Files**:
- `app/command-center/advisor/[id]/page.tsx` — Updated OnboardingTasksTab component

**Impact**:
- All 93 tasks now display correctly across 8 phases
- Phase breakdown: Sales Handoff (5), Post-Signing Prep (22), Onboarding Kick-Off (10), Pre-Launch Build (18), T-7 Final Countdown (8), Launch Day (12), Active Transition (12), Graduation & Handoff (6)

---

## [Completed] Tremor UI Migration — 2026-03-20

**What**: Complete redesign of all 11 pages with Tremor UI components and glass morphism effects. Eliminated 715+ inline styles, built 9 reusable components, centralized design tokens.

**Scope**:
- Migrated all pages to Tremor components (StatCard, ChartContainer, StatusBadge, ProgressIndicator, MetricBar, ScoreBadge, DataCard, FilterBar, TabGroup)
- Built premium CSS with glass effects (436 lines in globals.css)
- Centralized design tokens (colors, typography, formatters)
- Enhanced Tailwind config with Farther brand colors
- Achieved 100% Tailwind utility usage (0 inline styles remaining)

**Status**: ✅ Production deployed

**Files**:
- Component library: `components/ui/*` (9 components)
- Design system: `lib/design-tokens.ts`, `tailwind.config.ts`, `app/globals.css`
- Pages: All 11 command center pages migrated
- Documentation: `MIGRATION_COMPLETE.md`, `PR_DESCRIPTION.md`, `TREMOR_MIGRATION_PROGRESS.md`

**Metrics**:
- Pages migrated: 11/11 (100%)
- Inline styles removed: 715+
- Lines added: +3,847
- Lines removed: -1,129
- Net change: +2,718 lines
- Performance: Lighthouse 92/100
- Bundle size increase: +18%

---

## [Completed] RIA Hub Feature — 2026-03

**What**: Relationship intelligence hub for advisors in onboarding. Expandable advisor cards with AI briefings, email composer, and Google Drive link management.

**Scope**:
- Advisor detail cards with 4 AI briefing types (Context, Market Insights, Transition Strategy, Quick Talking Points)
- Email composer with 6 templates (Welcome, Check-in, Documentation Request, Market Update, Meeting Invite, Follow-up)
- Google Drive link manager (CRUD operations)
- PostgreSQL integration for drive links storage

**Status**: ✅ Production deployed

**Files**:
- Page: `app/command-center/ria-hub/page.tsx`
- API routes: `app/api/command-center/ria-hub/*.ts`
- Database migration: `scripts/migrate.ts` (advisor_drive_links table)
- Components: Tremor UI components, shared UI library

---

## [Completed] PostgreSQL Integration — 2026-03

**What**: Added PostgreSQL database for persistent data storage, starting with RIA Hub drive links.

**Scope**:
- Database connection via `pg` library
- Migration script with advisor_drive_links table
- Environment variable: DATABASE_URL
- Railway deployment configuration

**Status**: ✅ Production deployed

**Files**:
- Migration: `scripts/migrate.ts`
- Connection: `lib/db.ts` (if exists)
- Config: `package.json` (pg dependency), Railway config

---

## Template for New Entries

```markdown
## [In Progress] Feature Name — Started YYYY-MM-DD
**Scope**: What this feature does and what's planned
**Status**: What's done / what's remaining
**Files touched**: List of key files modified or created

## [Completed] Feature Name — YYYY-MM-DD
**What**: Brief description of what was built
**Files**: Key files added/modified
```

---

## Notes for Future Sessions

- Always read this file before starting work to understand recent changes
- Add [In Progress] entries when starting new features (helps next session pick up where you left off)
- Update to [Completed] when work is done
- Push to `main` after completing work (Railway auto-deploys)
- Reference CLAUDE.md for architecture patterns and BRANDING.md for design tokens
