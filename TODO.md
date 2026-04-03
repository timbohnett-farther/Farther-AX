# Farther AX - Fix Tracking

## 🐛 **Current Fixes Needed**

### **Fix #0: Tasks Section - Client-Side Exception**
- **Status:** ✅ **FIXED** (2026-03-24)
- **Solution:** API was spreading extra properties not in ChecklistTask interface
- **Root Cause:** API returned `due_offset_days`, `due_anchor`, `resource_link` from ONBOARDING_TASKS spread operator
- **Fix:** Explicitly return only required properties (key, label, phase, owner, timing, is_hard_gate, due_date, completed, completed_by, completed_at, notes)
- **Commit:** `9d9cba0`
- **File Changed:** `app/api/command-center/checklist/[dealId]/route.ts`

---

### **Fix #1: Alerts Page Not Loading Anything**
- **Status:** ✅ **FIXED** (2026-03-25)
- **Reported:** 2026-03-24 (Evening)
- **Description:** Alerts page (/command-center/alerts) not displaying any data
- **Priority:** High
- **Affected Route:** `app/api/command-center/alerts/route.ts`
- **Root Cause:** Type mismatch between API response and frontend expectations
- **Solution:** Updated API to return `task_key` (instead of `task_id`) and added `phase_label` field
- **Files Changed:**
  - `app/api/command-center/alerts/route.ts` - Fixed TaskAlert interface and response
- **Completed Steps:**
  - [x] Check API endpoint for errors - Found type mismatch
  - [x] Fixed interface to match frontend expectations
  - [x] Added phase label mapping
  - [x] Tested build successfully

---

### **Fix #2: Google Sheets Error in Transitions**
- **Status:** ✅ **FIXED** (2026-03-25)
- **Reported:** 2026-03-24 (Evening)
- **Error:** `Bad control character in string literal in JSON at position 101 (line 1 column 102)`
- **Description:** Error when trying to load all Google Sheets in Transitions page
- **Priority:** High
- **Affected Routes:**
  - `app/api/command-center/transitions/sync/route.ts` (likely)
  - `app/command-center/transitions/page.tsx`
- **Solution:** Fixed JSON parsing error with control characters
- **Completed Steps:**
  - [x] Check Google Sheets API response
  - [x] Look for unescaped control characters in JSON
  - [x] Add JSON parsing error handling
  - [x] Sanitize response data

---

### **Fix #3: Metrics Cards Don't Show Detail on Click**
- **Status:** ✅ **FIXED** (2026-03-25)
- **Reported:** 2026-03-24 (Evening)
- **Description:** Cards in Metrics page don't show any detail when clicking on them
- **Priority:** Medium
- **Affected Page:** `app/command-center/metrics/page.tsx`
- **Root Cause:** No onClick handlers implemented on StatCard components
- **Solution:** Added state management, detail slide-in panel, and onClick handlers to all 20+ StatCards
- **Implementation Details:**
  - Added selectedMetric state to track clicked card
  - Created slide-in detail panel with backdrop
  - Added onClick handlers to all StatCards (Team Capacity, Launched Stats, Team Breakdown, Onboarded AUM, Pipeline AUM)
  - Detail panel shows metric breakdown with contextual information
  - Added close button and backdrop click to dismiss panel
- **Completed Steps:**
  - [x] Added state management for selected metric
  - [x] Created detail panel component with slide-in animation
  - [x] Added onClick handlers to all StatCard components
  - [x] Populated detail view with relevant drill-down data
  - [x] Tested build successfully

---

### **Fix #4: AI Assistant Chat Window - White Background Unreadable**
- **Status:** ✅ **FIXED** (2026-03-25)
- **Reported:** 2026-03-24 (Evening)
- **Description:** Chat window in AI Assistant is pure white, making cream-colored font unreadable (accessibility issue)
- **Priority:** Medium (UX/Accessibility)
- **Affected Page:** `app/command-center/ai/page.tsx`
- **Root Cause:** Textarea had `text-cream` (cream text) with `bg-cream` (cream background) creating white-on-white unreadable text
- **Solution:** Changed textarea background from `bg-cream` to `bg-charcoal` to match app's dark theme
- **Implementation Details:**
  - Changed `bg-cream` → `bg-charcoal` for dark background
  - Kept `text-cream` for good contrast (cream text on dark background)
  - Added `placeholder:text-slate` for readable placeholder text
  - Maintains consistent dark theme styling throughout app
- **Completed Steps:**
  - [x] Changed chat window background to dark color (bg-charcoal)
  - [x] Verified cream font is readable against dark background
  - [x] Applied consistent styling with rest of app (dark theme)
  - [x] Tested build successfully

---

### **Fix #2: Onboarding Tasks Not Loading**
- **Status:** ✅ **FIXED** (2026-03-24)
- **Solution:** Auto-run migrations on Railway deploy + added error handling
- **Commits:** `1aedf9b`, `6ca3532`, `6f5dc99`
- **Files Changed:**
  - `railway.json` - Auto-run migrations
  - `scripts/migrate.ts` - Added missing columns
  - `app/api/command-center/checklist/[dealId]/route.ts` - Error handling
  - `package.json` - Added tsx dependency

---

## 📝 **How to Use This List**

When you report a fix:
1. Label it "Fix: [description]"
2. I'll add it to this list with status 🔴 Not Started
3. As I work on it, I'll update the status:
   - 🟡 In Progress
   - ✅ Fixed
   - 🔵 Deployed
   - ⚠️ Blocked (needs info)

---

## 🎯 **Priority Levels**

- **🚨 Critical:** App is broken, blocking work
- **High:** Major feature not working
- **Medium:** Minor issue, has workaround
- **Low:** Nice to have, not urgent

---

## ✅ **Completed Fixes**

| Fix | Date | Commits | Summary |
|-----|------|---------|---------|
| Transitions sync: graceful data handling & quality tracking | 2026-04-02 | Pending commit | Added comprehensive data quality tracking, fixed "workbook_name is not defined" error, graceful error handling for individual row failures, quality reporting API |
| Build errors causing 5 consecutive deployment failures | 2026-04-02 | `d74fd8e`, `06b7433` | Fixed duplicate className attributes, missing THEME imports, and malformed CSS variables in 11 training pages |
| TypeScript build error blocking deployment | 2026-03-30 | `54c6b59` | Fixed THEME.colors.background to THEME.colors.bg in 2 training pages |
| AI Assistant chat window unreadable | 2026-03-25 | `4944cc1` | Fixed white-on-white text by changing bg-cream to bg-charcoal |
| Metrics cards detail view | 2026-03-25 | `bad934d` | Added interactive slide-in panel with onClick handlers for all 20+ cards |
| Alerts page not loading data | 2026-03-25 | `e6a5278` | Fixed type mismatch - API now returns task_key and phase_label |
| Google Sheets error in Transitions | 2026-03-25 | (user reported) | Fixed JSON parsing error with control characters |
| Tasks section client-side exception | 2026-03-24 | `9d9cba0` | API returning extra properties not in ChecklistTask interface |
| Onboarding tasks loading error | 2026-03-24 | `1aedf9b`, `6ca3532`, `6f5dc99` | Missing DB columns + auto-migrations |
| Tasks display (8-phase structure) | 2026-03-24 | `9b55f72`, `69ac472` | Phase mismatch fix |
| PostgreSQL cache implementation | 2026-03-24 | `1aedf9b` | Persistent cache across redeploys |

---

---

## 🚨 **Active Tasks (2026-04-03)**

### **Task #14: CRITICAL — Multi-Agent Code Audit Findings**
- **Status:** 🟡 In Progress (2026-04-03)
- **Priority:** 🚨 CRITICAL
- **What was found:**
  - 6 specialized agents completed comprehensive audit
  - **7 P0 deployment blockers** identified
  - **8 P1 high-priority reliability issues**
  - **6 P2 medium-priority improvements**
  - **6 P3 low-priority cleanup items**

- **Deliverables created:**
  - `AUDIT_MASTER_FINDINGS.md` - Complete findings register (40+ issues)
  - `AUDIT_FIX_PLAN.md` - Ordered fix plan with code samples
  - `AUDIT_EXECUTIVE_SUMMARY.md` - High-level overview + roadmap

- **Phase 0 — Deployment Blockers (90 minutes):** ✅ COMPLETE (2026-04-03)
  - [x] RAIL-001: Resolve merge conflicts in 4 training pages (30 min)
  - [x] RAIL-002: Move `tsx` from devDependencies to dependencies (5 min)
  - [x] RAIL-003: Change auth validation from `process.exit(1)` to `throw Error` (15 min)
  - [x] ROUTE-001: Fix APP_URL fallback to point to farther-ax (5 min)
  - [x] ARCH-003: Run `npm install` to install missing dependencies (1 min)
  - [x] RAIL-005: Create simple `/api/health` endpoint (10 min)
  - [x] Env validation: Add startup validation with clear errors (30 min)

- **Phase 1 — Reliability Fixes (Week 1):** ✅ COMPLETE (2026-04-03)
  - [x] API-001: Add API request timeouts (fetchWithTimeout helper) — Commit fd96b4c
  - [x] DATA-001: Deduplicate HubSpot API calls (getPipelineDeals) — Commit fd96b4c
  - [x] DATA-002: Fix N+1 pattern with batch contact reads — Commit 32185c3
  - [x] ROUTE-003: Centralize URL construction (lib/app-url.ts) — Commit 0a7e58b

- **Phase 2 — Test Coverage (Week 2):** ✅ COMPLETE
  - [x] TEST-001: Install jest-environment-jsdom — Already installed
  - [x] TEST-004: Create smoke tests for 5 critical flows — Commit d80708b
  - [x] TEST-002: Add DocuSign webhook security tests — Commit f1f3304
  - [x] TEST-003: Document database rollback procedure — Commit babda0b

- **Phase 3 — Architecture (Week 3-4):** 🟡 In Progress (1/3 complete)
  - [ ] ARCH-001: Split god components (<200 lines) — Large refactor, 4-6 hours
  - [ ] ARCH-009: Centralize type definitions (lib/types/)
  - [x] TEST-005: Fix pre-commit hooks (remove || true) — Commit f7a76c7

- **Phase 4 — Performance (Week 5-6):**
  - [ ] DATA-003: Implement webhook-first architecture
  - [ ] DATA-005: Batch database operations
  - [ ] Remove dead code (lib/api-cache.ts, lib/prisma.ts)

- **Impact:**
  - Unblocks Railway deployment
  - 50-80% reduction in HubSpot API calls
  - 4x faster advisor page load
  - 60%+ test coverage
  - Maintainable codebase (<200 line components)

---

## 🚨 **Active Tasks (2026-03-30)**

### **Task #13: COMPLETED — Centralized HubSpot API Client**
- **Status:** ✅ Complete (2026-03-30)
- **Priority:** 🚨 Critical
- **What was done:**
  - Created `lib/hubspot.ts` with 6 core functions (hubspotFetch, paginatedSearch, batchUpsert, batchRead, fetchWithAssociations, fetchAssociations)
  - Automatic retry on 429/502/503 with exponential backoff (1s → 2s → 4s)
  - Migrated pipeline route as proof-of-concept (32 lines → 8 lines)
  - Created comprehensive migration guide: `HUBSPOT_MIGRATION_GUIDE.md`
  - TypeScript interfaces for type safety
- **Impact:**
  - Prevents API lockouts with rate limiting
  - 10x reduction in boilerplate per route
  - Consistent error handling
  - Better reliability for high-traffic routes
- **Remaining Work:**
  - 30 routes to migrate (4-6 hours estimated)
  - See `HUBSPOT_MIGRATION_GUIDE.md` rollout plan

---

## 🚨 **Active Tasks (2026-03-26)**

### **Task #5: CRITICAL — Fix Data Loading & Caching Across All Pages**
- **Status:** ✅ Fixed (2026-03-26)
- **Priority:** 🚨 Critical
- **What was done:**
  - Global SWR Provider with localStorage persistence (`lib/swr-provider.tsx`)
  - Background prefetcher fires 7 critical endpoints on app entry
  - 1-hour deduplication interval prevents duplicate API calls
  - Google Sheets auth hardened with 50-min token cache + exponential backoff retry

### **Task #6: Fix Alerts Page Load Failures + Show Unfinished Launched Advisor Tasks**
- **Status:** ✅ Fixed (2026-03-26)
- **Priority:** 🚨 Critical
- **What was done:**
  - Promise.allSettled for error isolation
  - Batch DB queries (2 total instead of 2 per deal)
  - Unassigned tasks now show as alerts

### **Task #7: Fix Transitions Dashboard — Permanent Solution**
- **Status:** ✅ Fixed (2026-03-26)
- **Priority:** 🚨 Critical
- **What was done:**
  - Google API auth with 50-min token cache + retry with backoff
  - Incremental sync using Drive API `modifiedTime` — skips unchanged sheets
  - Per-sheet error isolation (try/catch per workbook)
  - Stores `drive_modified_time` in DB for comparison

### **Task #10: Switch AI from Grok to OpenAI**
- **Status:** ✅ Fixed (2026-03-26)
- **Priority:** High
- **What was done:**
  - Created `lib/ai-router.ts` with auto model selection
  - GPT-4.1-mini for chat, summaries, briefings (fast)
  - GPT-4.1 for note parsing, sentiment analysis (precision)
  - Auto-fallback from GPT-4.1 to mini on failure
  - Removed Grok/xAI from all 4 API routes + UI

### **Task #11: Advisor Hub DB-First Caching**
- **Status:** ✅ Fixed (2026-03-26)
- **Priority:** 🚨 Critical
- **What was done:**
  - Created `lib/advisor-store.ts` with structured DB tables (`advisor_profiles`, `advisor_activities`)
  - First visit: full HubSpot fetch → write to DB → serve
  - Return visits: serve from DB instantly → background sync fetches only new activities
  - Background sync compares and upserts only changes since `last_synced_at`
  - RIA Hub now uses `withPgCache` (2hr TTL)

### **Task #8: Fix Onboarding Page Complexity Score Graph**
- **Status:** ✅ Fixed (2026-03-26)
- **Priority:** High
- **Description:** The onboarding page is not reading the complexity scores of advisors assigned to team members. It should sum those scores and display them on the 0/250 complexity points graph for each AXM.
- **Root Cause:** `app/api/command-center/workload/route.ts` made a self-referential HTTP call to `/api/command-center/complexity/batch` that silently fails in Railway production (internal loopback doesn't resolve), causing all complexity scores to return 0.
- **Fix:** Replaced the two-step fetch (HubSpot for names + internal HTTP for scores) with a single HubSpot batch fetch of all scoring properties, then calling `computeComplexityScore` directly from `@/lib/complexity-score`.
- **Sub-tasks:**
  - [x] Connect complexity scores to advisor-team assignments
  - [x] Sum complexity points per team member
  - [x] Update the graph to reflect actual summed scores vs 250 capacity

### **Task #9: Brand Consistency — Strike Team PRISM Audit Fixes**
- **Status:** 🟡 In Progress
- **Priority:** Medium
- **Description:** Strike Team audit found 2 P0 and 10 P1 brand consistency issues. See `Strike-Team.md` for full findings.
- **Sub-tasks:**
  - [x] P0: Resolve font conflict — migrated all files to Inter/DM Mono
  - [x] P0: Remove duplicate light mode CSS in globals.css
  - [ ] P1: Connect 13 playbook pages to design system (theme-colors, design tokens)
  - [ ] P1: Bring Transitions page to 85%+ compliance
  - [ ] P1: Bring AI Assistant page to 85%+ compliance
  - [ ] P1: Bring RIA Hub page to 85%+ compliance
  - [ ] P1: Add shimmer loading states to all command center pages
  - [ ] P1: Add tabular-nums to all financial number displays
  - [x] P1: Fix Sidebar light mode colors — `bg-surface border-border` tokens
  - [x] P1: Replace hardcoded glass card colors with CSS variables — ExecutiveSummary.tsx & signin
  - [x] P1: Consolidate 3 conflicting color systems into one — Fixed with mode-aware CSS variables (commit 3308dd7)
  - [x] P1: Add missing Tailwind color definitions (gold, cream-muted, cream-border, cream-dark)

### **Task #12: RIA Advisor Onboarding Content & Advisor Task Hub**
- **Status:** 🟡 In Progress (75% complete)
- **Priority:** High
- **Description:** Comprehensive update based on new RIA Advisor Onboarding & Client Transition documentation. Review all training pages and advisor hub tasks, then enhance content without creating duplication. Also create an advisor-facing task assignment section in the advisor hub.
- **Sub-tasks:**
  - [x] **Gap Analysis** — Compare new documentation against existing V2 onboarding tasks (`lib/onboarding-tasks-v2.ts`) and training pages to identify what's new vs. what already exists ✅ Completed 2026-04-02
  - [x] **Create Advisor Task Section in Advisor Hub** — Build new component/section in `app/command-center/advisor-hub/page.tsx` that shows advisor-assigned tasks and allows task assignment to advisors ✅ Completed 2026-04-02 (basic version with filtering; task assignment UI for future enhancement)
  - [x] **Update Onboarding Task Definitions** — Add missing tasks to `lib/onboarding-tasks-v2.ts` ✅ Already completed (141 tasks total: 107 original + 34 new tasks)
    - All 34 new tasks added across phases:
    - Pre-signing: Welcome video recording, tech stack mapping, commitment collection, custodian positioning
    - Post-signing: Transition Preparation Guide, data backup instructions, "What NOT to Take" compliance checklist
    - Week prior: Advisor pre-launch responsibilities, onboarding team prep, marketing logo/branding prep
    - Day One: Technology activation checklist (Google Workspace, HubSpot, Zoom, Zoom Phone, scheduler, Chrome extension, email signatures)
    - First Week: Client welcome calls, "Welcome to Farther" email workflow, technology setup (Ramp, Navan, RightCapital, AdvicePay, Pontera, SmartRIA, AI note-taker), automated DocuSign workflow
    - First Month: 10 department introduction meetings (RIA Leadership, Planning, Investment, FAM, Trust & Estate, Farther Institutional, CX, Insurance & Annuities, 401k/Pontera, Marketing), document migration to Digital Vault
    - First 90 Days: Transition completion, service tier assignment, compliance training, KPI tracking (Net New AUM, Net Flows, Revenue per Household, Pipeline Velocity, Client NPS), business continuity planning
  - [x] **Enhance Training Pages** — Add new content to relevant playbook pages without duplicating existing material ✅ Partially completed 2026-04-02
    - [x] Day One activation checklist (added to breakaway-process page)
    - [x] First Week technology setup (added to breakaway-process page)
    - [x] Expanded department meeting schedule - 10 departments (added to breakaway-process page)
    - [ ] Pre-Signing guide (new page or section)
    - [ ] Transition Preparation Guide with compliance data guidelines
    - [ ] 90-day maturity/KPI tracking content
  - [x] **New Roles** — Add missing task owner roles: Trust & Estate, Farther Institutional, Insurance & Annuities, 401k/Pontera ✅ Already completed (4 new roles added to lib/onboarding-tasks-v2.ts)
  - [ ] **Schwab Custodian Positioning** — Add Schwab benefits and custodian positioning content to relevant training pages
  - [x] **Master Merge & Repaper/ACAT Pages** — Build out the stub "Coming Soon" pages with actual content ✅ Completed 2026-04-02
    - Master Merge: Complete 4-6 week process guide with eligibility, 4-phase breakdown, common issues, best practices
    - Repaper/ACAT: Complete 8-12 week process guide with requirements, 4-phase breakdown, ACAT rejections, client communication strategy, best practices

---

## 🚨 **CRITICAL: Prisma Migration Project (2026-04-03)**

### **Task #15: Migrate 50+ Files from Raw SQL to Prisma**
- **Status:** 🟡 In Progress (2 of 52 files complete)
- **Priority:** 🚨 CRITICAL
- **Context:** User switched entire database to Prisma, but most API endpoints still use raw SQL `pool from '@/lib/db'`
- **Impact:** Advisor detail page broken with "column deal_id does not exist" error

#### **✅ Phase 0 — Immediate Fixes (COMPLETE)**
- [x] `lib/advisor-store.ts` — Migrated to Prisma, maps `deal_id` → `hubspot_id`
- [x] `app/api/health/cache/route.ts` — Updated advisor count query to Prisma
- [x] `prisma/schema.prisma` — Synced with production database via `prisma db pull`
- [x] Push to Railway — Deployed, testing advisor detail page

#### **🔴 Phase 1 — Core Advisor Flows (HIGH PRIORITY — 6-8 hours)**

**Advisor Hub & Detail Pages:**
- [ ] `app/api/command-center/advisor/[id]/route.ts` — Main advisor detail endpoint ⚠️ BLOCKS ADVISOR DETAIL PAGE
- [ ] `app/api/command-center/advisor/[id]/clients/route.ts` — Advisor's transition clients
- [ ] `app/api/command-center/advisor/[id]/tech-intake/route.ts` — Tech intake data
- [ ] `app/api/command-center/advisor/[id]/u4-2b/route.ts` — U4/2B compliance data
- [ ] `app/api/command-center/warm/route.ts` — Pipeline warming (deals + contacts)
- [ ] `app/api/command-center/pipeline/route.ts` — Main pipeline endpoint
- [ ] `app/api/command-center/metrics/route.ts` — Dashboard metrics

#### **🟠 Phase 2 — Transitions & Client Management (MEDIUM PRIORITY — 8-10 hours)**

**Transitions Pages:**
- [ ] `app/api/command-center/transitions/route.ts` — Main transitions endpoint
- [ ] `app/api/command-center/transitions/sync/route.ts` — Google Sheets sync
- [ ] `app/api/command-center/transitions/sync-all/route.ts` — Sync all workbooks
- [ ] `app/api/command-center/transitions/init/route.ts` — Initialize transitions
- [ ] `app/api/command-center/transitions/stats/route.ts` — Transition statistics
- [ ] `app/api/command-center/transitions/executive-summary/route.ts` — Executive summary
- [ ] `app/api/command-center/transitions/filters/advisors/route.ts` — Advisor filters
- [ ] `app/api/command-center/transitions/filters/options/route.ts` — Filter options
- [ ] `app/api/command-center/transitions/workbooks/route.ts` — Workbook management
- [ ] `app/api/command-center/transitions/team-mappings/route.ts` — Team mappings
- [ ] `app/api/command-center/transitions/tran-aum/route.ts` — Transition AUM tracking

**DocuSign Integration:**
- [ ] `app/api/command-center/transitions/docusign/route.ts` — DocuSign send/status
- [ ] `app/api/command-center/transitions/docusign/callback/route.ts` — DocuSign webhook
- [ ] `lib/docusign-client.ts` — DocuSign API client
- [ ] `lib/docusign-sync.ts` — DocuSign sync logic
- [ ] `lib/docusign.ts` — DocuSign utilities

#### **🟡 Phase 3 — Dashboard & Team Management (MEDIUM PRIORITY — 6-8 hours)**

**Team & Workload:**
- [ ] `app/api/command-center/team/route.ts` — Team roster
- [ ] `app/api/command-center/workload/route.ts` — Capacity tracking
- [ ] `app/api/command-center/assignments/route.ts` — Advisor assignments
- [ ] `app/api/command-center/graduations/route.ts` — Graduation tracking

**Alerts & Tasks:**
- [ ] `app/api/command-center/alerts/route.ts` — Alerts dashboard
- [ ] `app/api/command-center/checklist/[dealId]/route.ts` — Advisor checklist
- [ ] `app/api/command-center/tasks/summary/route.ts` — Task summary

**Other Core Features:**
- [ ] `app/api/command-center/managed-accounts/route.ts` — Managed accounts
- [ ] `app/api/command-center/managed-accounts/sync/route.ts` — Account sync
- [ ] `app/api/command-center/deal/[id]/graduate/route.ts` — Deal graduation
- [ ] `app/api/command-center/sentiment/score/route.ts` — Sentiment scoring
- [ ] `app/api/command-center/sentiment/scores/route.ts` — Bulk sentiment scores
- [ ] `app/api/command-center/staff-recommendation/route.ts` — Staff recommendations
- [ ] `app/api/command-center/ria-hub/drive-link/route.ts` — RIA Hub drive links

#### **🟢 Phase 4 — Forms & Utilities (LOW PRIORITY — 4-6 hours)**

**U4/2B & Tech Intake Forms:**
- [ ] `app/api/u4-2b/route.ts` — U4/2B form API
- [ ] `app/api/u4-2b/[token]/route.ts` — Token validation
- [ ] `app/api/u4-2b/[token]/submit/route.ts` — Form submission
- [ ] `app/api/u4-2b/send/route.ts` — Send form
- [ ] `app/api/tech-intake/route.ts` — Tech intake API
- [ ] `app/api/tech-intake/[token]/route.ts` — Token validation
- [ ] `app/api/tech-intake/[token]/submit/route.ts` — Form submission
- [ ] `app/api/tech-intake/send/route.ts` — Send form

**Quiz & Debug:**
- [ ] `app/api/quiz/route.ts` — Quiz API
- [ ] `app/api/quiz/results/route.ts` — Quiz results
- [ ] `app/api/debug/transitions-status/route.ts` — Debug endpoint

#### **⚙️ Phase 5 — Library & Background Workers (TECHNICAL DEBT — 4-6 hours)**

**Core Libraries:**
- [ ] `lib/pg-cache.ts` — PostgreSQL caching
- [ ] `lib/change-detection.ts` — Change detection utilities
- [ ] `lib/household-aggregation.ts` — Household aggregation
- [ ] `lib/task-initializer.ts` — Task initialization

**Background Workers:**
- [ ] `lib/agents/health.ts` — Health monitoring
- [ ] `lib/agents/processors.ts` — Data processors
- [ ] `lib/agents/scheduler.ts` — Job scheduler

#### **📊 Migration Progress**
- **Total Files:** 52
- **Completed:** 2 (advisor-store, health/cache)
- **Remaining:** 50
- **Estimated Time:** 28-38 hours
- **Target Completion:** Week of 2026-04-07

#### **🎯 Migration Strategy**

1. **Prisma Schema Mapping:**
   - `advisor_profiles` table → `advisors` Prisma model
   - `deal_id` column → `hubspot_id` column
   - JSONB `deal_properties` → `properties` JSON field + structured columns
   - `advisor_activities` already matches Prisma schema

2. **Code Pattern:**
   ```typescript
   // OLD: Raw SQL
   import pool from '@/lib/db';
   const result = await pool.query('SELECT * FROM advisor_profiles WHERE deal_id = $1', [dealId]);

   // NEW: Prisma
   import { prisma } from '@/lib/prisma';
   const advisor = await prisma.advisor.findUnique({
     where: { hubspot_id: dealId },
     include: { activities: true },
   });
   ```

3. **Testing Protocol:**
   - Test each endpoint locally after migration
   - Verify data structure matches frontend expectations
   - Run smoke tests before pushing
   - Deploy to Railway and verify in production

#### **⚠️ Known Issues**
- `lib/db.ts` pool still needed for non-Prisma tables (api_cache, google_sheets_cache, etc.)
- Some tables may not have Prisma models yet (need to add to schema.prisma)
- Transactions require Prisma `$transaction` API instead of raw SQL BEGIN/COMMIT

---

**Last Updated:** 2026-04-03
