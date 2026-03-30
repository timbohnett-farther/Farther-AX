# Farther AX - Complete Site Audit
**Date:** 2026-03-30
**Auditor:** Claude Sonnet 4.5
**Total Pages:** 30

---

## Executive Summary

**Status Overview:**
- ✅ **Fixed:** 4 pages (Sign-in, Introduction, Onboarding vs. Transitions, Key Documents)
- 🔴 **Critical Issues:** 9 pages with undefined Tailwind classes
- 🟡 **Medium Issues:** 11 pages not using theme system
- 🟢 **Minor Issues:** 1 page with narrow container

**Immediate Action Required:** 9 training/feature pages need complete theme system rewrite

---

## 🔴 CRITICAL: Pages with Undefined Tailwind Classes

These pages use undefined classes that don't exist in the Tailwind config and cause inconsistent styling:

### High Priority (Training Pages - User Facing)

1. **app/ma/page.tsx** - M&A Page
   - **Issues:** 63 instances
   - **Classes:** text-foreground, bg-card, border-border, glass-card, text-foreground-muted, bg-teal, text-teal
   - **Impact:** Text bunching, inconsistent colors
   - **Fix:** Complete rewrite with THEME.colors.* inline styles
   - **Estimate:** 30-45 minutes

2. **app/no-to-low-aum/page.tsx** - No to Low AUM Page
   - **Issues:** 1 instance
   - **Fix:** Quick replacement
   - **Estimate:** 5 minutes

3. **app/master-merge/page.tsx** - Master Merge Page
   - **Issues:** 3 instances
   - **Fix:** Quick replacement
   - **Estimate:** 10 minutes

4. **app/lpoa/page.tsx** - LPOA Page
   - **Issues:** 2 instances
   - **Fix:** Quick replacement
   - **Estimate:** 10 minutes

5. **app/knowledge-check/page.tsx** - Knowledge Check Page
   - **Issues:** 1 instance
   - **Fix:** Quick replacement
   - **Estimate:** 5 minutes

6. **app/calendar-generator/page.tsx** - Calendar Generator
   - **Issues:** 2 instances
   - **Fix:** Quick replacement
   - **Estimate:** 10 minutes

### Medium Priority (Internal Tools)

7. **app/command-center/ai/page.tsx** - AI Assistant
   - **Issues:** Undefined classes
   - **Impact:** Internal tool, lower user visibility
   - **Estimate:** 20 minutes

8. **app/command-center/ria-hub/page.tsx** - RIA Hub
   - **Issues:** Undefined classes
   - **Impact:** Internal tool
   - **Estimate:** 20 minutes

9. **app/ui-showcase/page.tsx** - UI Showcase (Dev Tool)
   - **Issues:** Undefined classes
   - **Impact:** Development only
   - **Estimate:** 15 minutes

---

## 🟡 MEDIUM: Pages Not Using Theme System

These pages don't use the useTheme() hook and may have hardcoded colors:

1. **app/auth/error/page.tsx** - Auth Error Page
   - Also has narrow container (max-w-md)
   - Should match sign-in page styling

2. **app/calendar-generator/page.tsx** - Already in critical list

3. **app/command-center/ai/page.tsx** - Already in critical list

4. **app/command-center/complexity/page.tsx** - Complexity Calculator
   - Needs theme system integration

5. **app/command-center/metrics/page.tsx** - Metrics Dashboard
   - Needs theme system integration

6. **app/command-center/ria-hub/page.tsx** - Already in critical list

7. **app/forms/tech-intake/[token]/page.tsx** - Tech Intake Form
   - Form styling needs consistency

8. **app/forms/u4-2b/[token]/page.tsx** - U4/2B Form
   - Form styling needs consistency

9. **app/knowledge-check/page.tsx** - Already in critical list

10. **app/page.tsx** - Root/Home Page
    - Should use theme system

11. **app/ui-showcase/page.tsx** - Already in critical list

---

## ✅ COMPLETED: Pages Fixed and Working

1. **app/auth/signin/page.tsx** ✅
   - Fixed narrow container (448px → 576px)
   - Full theme system integration
   - Commit: `4e603f7`

2. **app/introduction/page.tsx** ✅
   - Proper theme system usage
   - Max-w-4xl container
   - Gold color working

3. **app/onboarding-vs-transitions/page.tsx** ✅
   - Proper theme system usage
   - Max-w-4xl container
   - Clean layout

4. **app/key-documents/page.tsx** ✅
   - Complete rewrite with theme
   - Max-w-5xl container
   - Table and card layouts working
   - Commit: `3a0d65d`

---

## 📊 Detailed Breakdown by Category

### Training Pages (13 total)
| Page | Status | Issues | Priority |
|------|--------|--------|----------|
| Introduction | ✅ Fixed | 0 | - |
| Onboarding vs. Transitions | ✅ Fixed | 0 | - |
| Key Documents | ✅ Fixed | 0 | - |
| Breakaway | 🟢 Clean | 0 | - |
| Independent RIA | 🟢 Clean | 0 | - |
| M&A | 🔴 Critical | 63 | HIGH |
| No to Low AUM | 🔴 Needs Fix | 1 | MEDIUM |
| Master Merge | 🔴 Needs Fix | 3 | MEDIUM |
| LPOA | 🔴 Needs Fix | 2 | MEDIUM |
| Repaper/ACAT | 🟢 Clean | 0 | - |
| Breakaway Process | 🟢 Clean | 0 | - |
| Knowledge Check | 🔴 Needs Fix | 1 | MEDIUM |
| Calendar Generator | 🔴 Needs Fix | 2 | MEDIUM |

### Command Center Pages (9 total)
| Page | Status | Issues |
|------|--------|--------|
| Pipeline | 🟢 Clean | Theme working |
| Advisor Hub | 🟢 Clean | Theme working |
| Individual Advisor | 🟢 Clean | Theme working |
| Alerts | 🟢 Clean | Theme working |
| Metrics | 🟡 No Theme | Needs integration |
| Onboarding | 🟢 Clean | Theme working |
| Transitions | 🟢 Clean | Theme working |
| Team | 🟢 Clean | Theme working |
| Complexity | 🟡 No Theme | Needs integration |
| AI Assistant | 🔴 Issues | Undefined classes |
| RIA Hub | 🔴 Issues | Undefined classes |

### Auth Pages (2 total)
| Page | Status | Issues |
|------|--------|--------|
| Sign In | ✅ Fixed | 0 |
| Error | 🟡 Needs Fix | Narrow + no theme |

### Form Pages (2 total)
| Page | Status | Issues |
|------|--------|--------|
| Tech Intake | 🟡 No Theme | Needs integration |
| U4/2B | 🟡 No Theme | Needs integration |

### Other Pages (4 total)
| Page | Status | Issues |
|------|--------|--------|
| Home/Root | 🟡 No Theme | Needs integration |
| UI Showcase | 🔴 Issues | Dev tool - low priority |

---

## 🎯 Recommended Fix Order

### Phase 1: User-Facing Training Pages (High Impact)
**Estimated Time:** 2-3 hours

1. ✅ ~~Sign-in page~~ (DONE)
2. ✅ ~~Key Documents~~ (DONE)
3. **M&A page** (63 issues - most complex)
4. **No to Low AUM** (1 issue - quick)
5. **Master Merge** (3 issues - quick)
6. **LPOA** (2 issues - quick)
7. **Knowledge Check** (1 issue - quick)
8. **Calendar Generator** (2 issues - quick)

### Phase 2: Internal Tools (Medium Impact)
**Estimated Time:** 1-2 hours

9. **Auth Error page** (narrow + theme)
10. **Command Center - AI Assistant**
11. **Command Center - RIA Hub**
12. **Command Center - Complexity**
13. **Command Center - Metrics**

### Phase 3: Forms & Other (Lower Impact)
**Estimated Time:** 1 hour

14. **Tech Intake Form**
15. **U4/2B Form**
16. **Home Page**
17. **UI Showcase** (dev tool)

---

## 🔧 Standard Fix Template

For each page with undefined classes, follow this pattern:

```tsx
// 1. Add useTheme at top
import { useTheme } from '@/lib/theme-provider';

// 2. Get THEME in component
const { THEME } = useTheme();

// 3. Replace undefined classes with inline styles
// BEFORE:
<div className="text-foreground bg-card border-border">

// AFTER:
<div style={{
  color: THEME.colors.text,
  backgroundColor: THEME.colors.surface,
  border: `1px solid ${THEME.colors.border}`
}}>

// 4. Ensure proper container width (min max-w-4xl)
<div className="max-w-4xl mx-auto px-8 py-20">
```

---

## 📈 Progress Tracking

- **Total Pages:** 30
- **Fixed:** 4 (13%)
- **Critical Issues:** 9 (30%)
- **Medium Issues:** 11 (37%)
- **Clean:** 6 (20%)

**Overall Health Score:** 33% (Critical threshold - immediate action required)

---

## ✅ Success Criteria

A page is considered "fixed" when:

1. ✅ Uses `useTheme()` hook with `THEME.colors.*`
2. ✅ No undefined Tailwind classes
3. ✅ Container width >= 576px (max-w-lg minimum)
4. ✅ Proper spacing (no text bunching)
5. ✅ Consistent with brand guide
6. ✅ Responsive breakpoints working
7. ✅ Light/dark mode both working

---

## 🚀 Next Actions

1. **Immediate:** Fix remaining 5 training pages (est. 80 minutes)
2. **Today:** Fix internal tool pages (est. 90 minutes)
3. **This Week:** Fix forms and other pages (est. 60 minutes)

**Total Estimated Time to 100% Fixed:** ~4 hours

---

**Audit Complete** | Questions? Review individual page files for specific issues.
