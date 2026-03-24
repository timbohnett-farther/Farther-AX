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
- **Status:** 🔴 Not Started
- **Reported:** 2026-03-24 (Evening)
- **Description:** Alerts page (/command-center/alerts) not displaying any data
- **Priority:** High
- **Affected Route:** `app/api/command-center/alerts/route.ts`
- **Next Steps:**
  - [ ] Check API endpoint for errors
  - [ ] Verify database queries
  - [ ] Check frontend page for display issues
  - [ ] Test with sample data

---

### **Fix #2: Google Sheets Error in Transitions**
- **Status:** 🔴 Not Started
- **Reported:** 2026-03-24 (Evening)
- **Error:** `Bad control character in string literal in JSON at position 101 (line 1 column 102)`
- **Description:** Error when trying to load all Google Sheets in Transitions page
- **Priority:** High
- **Affected Routes:**
  - `app/api/command-center/transitions/sync/route.ts` (likely)
  - `app/command-center/transitions/page.tsx`
- **Next Steps:**
  - [ ] Check Google Sheets API response
  - [ ] Look for unescaped control characters in JSON
  - [ ] Add JSON parsing error handling
  - [ ] Sanitize response data

---

### **Fix #3: Metrics Cards Don't Show Detail on Click**
- **Status:** 🔴 Not Started
- **Reported:** 2026-03-24 (Evening)
- **Description:** Cards in Metrics page don't show any detail when clicking on them
- **Priority:** Medium
- **Affected Page:** `app/command-center/metrics/page.tsx`
- **Next Steps:**
  - [ ] Check click handlers on metric cards
  - [ ] Verify detail panel/modal implementation
  - [ ] Check if detail data is being fetched
  - [ ] Test card interaction

---

### **Fix #4: AI Assistant Chat Window - White Background Unreadable**
- **Status:** 🔴 Not Started
- **Reported:** 2026-03-24 (Evening)
- **Description:** Chat window in AI Assistant is pure white, making cream-colored font unreadable (accessibility issue)
- **Priority:** Medium (UX/Accessibility)
- **Affected Page:** `app/command-center/ai/page.tsx`
- **Next Steps:**
  - [ ] Change chat window background to dark color (match app theme)
  - [ ] Ensure cream font (#FAF7F2) is readable against new background
  - [ ] Apply consistent styling with rest of app (dark theme)
  - [ ] Test text contrast ratio (WCAG AA compliance)

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
| Tasks section client-side exception | 2026-03-24 | `9d9cba0` | API returning extra properties not in ChecklistTask interface |
| Onboarding tasks loading error | 2026-03-24 | `1aedf9b`, `6ca3532`, `6f5dc99` | Missing DB columns + auto-migrations |
| Tasks display (8-phase structure) | 2026-03-24 | `9b55f72`, `69ac472` | Phase mismatch fix |
| PostgreSQL cache implementation | 2026-03-24 | `1aedf9b` | Persistent cache across redeploys |

---

**Last Updated:** 2026-03-24
