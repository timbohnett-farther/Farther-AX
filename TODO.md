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
  - [ ] P1: Consolidate 3 conflicting color systems into one
  - [x] P1: Add missing Tailwind color definitions (gold, cream-muted, cream-border, cream-dark)

### **Task #12: RIA Advisor Onboarding Content & Advisor Task Hub**
- **Status:** 🔴 Not Started
- **Priority:** High
- **Description:** Comprehensive update based on new RIA Advisor Onboarding & Client Transition documentation. Review all training pages and advisor hub tasks, then enhance content without creating duplication. Also create an advisor-facing task assignment section in the advisor hub.
- **Sub-tasks:**
  - [ ] **Gap Analysis** — Compare new documentation against existing V2 onboarding tasks (`lib/onboarding-tasks-v2.ts`) and training pages to identify what's new vs. what already exists
  - [ ] **Create Advisor Task Section in Advisor Hub** — Build new component/section in `app/command-center/advisor-hub/page.tsx` that shows advisor-assigned tasks and allows task assignment to advisors
  - [ ] **Update Onboarding Task Definitions** — Add missing tasks to `lib/onboarding-tasks-v2.ts`:
    - Pre-signing: Welcome video recording, tech stack mapping, commitment collection, custodian positioning
    - Post-signing: Transition Preparation Guide, data backup instructions, "What NOT to Take" compliance checklist
    - Week prior: Advisor pre-launch responsibilities, onboarding team prep, marketing logo/branding prep
    - Day One: Technology activation checklist (Google Workspace, HubSpot, Zoom, Zoom Phone, scheduler, Chrome extension, email signatures)
    - First Week: Client welcome calls, "Welcome to Farther" email workflow, technology setup (Ramp, Navan, RightCapital, AdvicePay, Pontera, SmartRIA, AI note-taker), automated DocuSign workflow
    - First Month: 10 department introduction meetings (RIA Leadership, Planning, Investment, FAM, Trust & Estate, Farther Institutional, CX, Insurance & Annuities, 401k/Pontera, Marketing), document migration to Digital Vault
    - First 90 Days: Transition completion, service tier assignment, compliance training, KPI tracking (Net New AUM, Net Flows, Revenue per Household, Pipeline Velocity, Client NPS), business continuity planning
  - [ ] **Enhance Training Pages** — Add new content to relevant playbook pages without duplicating existing material:
    - Pre-Signing guide (new page or section)
    - Transition Preparation Guide with compliance data guidelines
    - Day One activation checklist
    - First Week technology setup
    - Expanded department meeting schedule (10 departments)
    - 90-day maturity/KPI tracking content
  - [ ] **New Roles** — Add missing task owner roles: Trust & Estate, Farther Institutional, Insurance & Annuities, 401k/Pontera
  - [ ] **Schwab Custodian Positioning** — Add Schwab benefits and custodian positioning content to relevant training pages
  - [ ] **Master Merge & Repaper/ACAT Pages** — Build out the stub "Coming Soon" pages with actual content

---

**Last Updated:** 2026-03-26
