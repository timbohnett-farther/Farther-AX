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
- **Status:** 🟡 In Progress
- **Priority:** 🚨 Critical
- **Description:** Pages that load HubSpot data (pipeline, advisor hub, etc.) fail on first load and require multiple refreshes. Data should pre-fetch in the background on app entry and cache for 10+ minutes so returning users see instant data.
- **SWAT Plan:** See `DATA-LOADING-SWAT.md`

### **Task #6: Fix Alerts Page Load Failures + Show Unfinished Launched Advisor Tasks**
- **Status:** ✅ Fixed (2026-03-26)
- **Priority:** 🚨 Critical
- **Description:** Alerts page frequently fails to load data. Additionally, launched advisors with unfinished onboarding tasks are NOT appearing as alerts — they should all show as actionable alerts that need to be addressed.
- **Sub-tasks:**
  - [ ] Debug and fix alerts API endpoint reliability (add withPgCache, error handling)
  - [ ] Query all launched advisors with incomplete checklist tasks
  - [ ] Generate alerts for each unfinished task on launched advisors
  - [ ] Ensure alerts appear on first load without refresh

### **Task #7: Fix Transitions Dashboard — Permanent Solution**
- **Status:** 🟡 In Progress
- **Priority:** 🚨 Critical
- **Description:** Transitions page stops working intermittently. Root causes: Google API auth expiry, no error isolation per sheet, rate limiting, full re-sync every time. Need incremental sync with change detection.
- **SWAT Plan:** See `TRANSITIONS-SWAT.md`
- **Sub-tasks:**
  - [ ] Phase 1: Error isolation — try/catch per sheet, auth token caching, retry logic
  - [ ] Phase 2: Incremental sync — check modifiedTime, row checksums, only update changes
  - [ ] Phase 3: Google API hardening — rate limiter, timeouts, backoff
  - [ ] Phase 4: DB optimization — batch upserts, transactions, pool monitoring
  - [ ] Phase 5: Auto-sync scheduler — cron-based, distributed lock, no page-load trigger

### **Task #8: Fix Onboarding Page Complexity Score Graph**
- **Status:** 🔴 Not Started
- **Priority:** High
- **Description:** The onboarding page is not reading the complexity scores of advisors assigned to team members. It should sum those scores and display them on the 0/250 complexity points graph for each AXM.
- **Sub-tasks:**
  - [ ] Connect complexity scores to advisor-team assignments
  - [ ] Sum complexity points per team member
  - [ ] Update the graph to reflect actual summed scores vs 250 capacity

### **Task #8: Brand Consistency — Strike Team PRISM Audit Fixes**
- **Status:** 🔴 Not Started
- **Priority:** Medium
- **Description:** Strike Team audit found 2 P0 and 10 P1 brand consistency issues. See `Strike-Team.md` for full findings.
- **Sub-tasks:**
  - [ ] P0: Resolve font conflict (ABC Arizona Text/Fakt vs Inter/DM Mono)
  - [ ] P0: Remove duplicate light mode CSS in globals.css
  - [ ] P1: Connect 13 playbook pages to design system (theme-colors, design tokens)
  - [ ] P1: Bring Transitions page to 85%+ compliance
  - [ ] P1: Bring AI Assistant page to 85%+ compliance
  - [ ] P1: Bring RIA Hub page to 85%+ compliance
  - [ ] P1: Add shimmer loading states to all command center pages
  - [ ] P1: Add tabular-nums to all financial number displays
  - [ ] P1: Fix Sidebar light mode colors
  - [ ] P1: Replace hardcoded glass card colors with CSS variables
  - [ ] P1: Consolidate 3 conflicting color systems into one
  - [ ] P1: Add missing Tailwind color definitions (cream, teal variants)

---

**Last Updated:** 2026-03-26
