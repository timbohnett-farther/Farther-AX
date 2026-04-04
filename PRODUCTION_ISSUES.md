# Production Issues — Farther AX

**Last Updated:** 2026-04-03

---

## 🚨 ACTIVE ISSUE: Multiple API Endpoints Failing After Prisma Migration

**Status:** 🔴 **CRITICAL** — Blocking production use
**Reported:** 2026-04-03 (immediately after Prisma migration push)
**Severity:** High — 5 core endpoints returning 500 errors

### Symptoms

Multiple API endpoints failing with 500/400 errors:

```
❌ /api/command-center/complexity (400)
❌ /api/command-center/team (500)
❌ /api/command-center/transitions (500)
❌ /api/command-center/sentiment/scores (500)
❌ /api/command-center/metrics (500)
```

### Timeline

1. **2026-04-03 (earlier)**: Completed 100% Prisma migration (52/52 files)
2. **2026-04-03**: Pushed commits to main (cb1b8bd, 28e4592, 34731b0, 625cab1)
3. **2026-04-03**: Railway auto-deployed
4. **2026-04-03 (now)**: User reports multiple endpoints failing

### Likely Root Causes

Based on Prisma migration, possible issues:

1. **Missing Prisma Client Generation**
   - Railway may not be running `prisma generate` during build
   - Check: `package.json` scripts for postinstall hook

2. **Database Connection Issues**
   - `DATABASE_URL` environment variable not set correctly in Railway
   - Prisma Client not connecting to PostgreSQL

3. **TypeScript/Build Issues**
   - Prisma types not generated at build time
   - Import errors for `@prisma/client`

4. **Runtime Query Errors**
   - BigInt serialization issues in API responses
   - Malformed Prisma queries after migration

### Required Information

To diagnose, need one of:
- [ ] Railway deployment logs (error stack traces)
- [ ] Browser console Network tab responses (error messages)
- [ ] Local build/run output (`npm run build && npm start`)

### Next Steps

1. **Check Railway Environment Variables**
   - Verify `DATABASE_URL` is set
   - Verify it includes `?schema=public&sslmode=require`

2. **Check Railway Build Logs**
   - Look for `prisma generate` in build output
   - Check for TypeScript compilation errors

3. **Check Runtime Logs**
   - Filter for `[Error]` or stack traces
   - Look for Prisma Client connection errors

4. **Rollback Plan (if needed)**
   - Revert to commit before Prisma migration: `323d067`
   - Restore pool-based queries temporarily
   - Debug Prisma issues in staging environment

### Files to Check

Priority investigation targets:
```
app/api/command-center/team/route.ts
app/api/command-center/metrics/route.ts
app/api/command-center/transitions/route.ts
app/api/command-center/sentiment/scores/route.ts
app/api/command-center/complexity/route.ts
```

### Test Plan After Fix

1. Test each failing endpoint individually
2. Verify database queries return correct data
3. Check for BigInt serialization issues in JSON responses
4. Load test transitions page (primary user workflow)
5. Verify all dashboard metrics display correctly

---

## Issue Resolution Template

When resolved, move to bottom of file under "Resolved Issues" with:
- **Root Cause:** [What actually caused it]
- **Fix Applied:** [Code changes made]
- **Commits:** [SHA references]
- **Verification:** [How we confirmed it's fixed]
- **Prevention:** [How to prevent in future]

---

## Resolved Issues

_None yet — this is the first tracked issue_
