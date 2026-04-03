# Farther AX — Ordered Fix Plan

**Generated:** 2026-04-03
**Priority:** P0 → P1 → P2 → P3
**Estimated Total Effort:** 8-10 weeks (staged)

---

## 🚨 Phase 0: Deployment Blockers (90 minutes) — DO IMMEDIATELY

These must be fixed before ANY deployment to Railway production.

### Fix 0.1: Resolve Merge Conflicts
**Issue:** RAIL-001 — 4 files have unresolved merge conflicts preventing build
**Files:** `app/breakaway/page.tsx`, `app/independent-ria/page.tsx`, `app/key-documents/page.tsx`, `app/no-to-low-aum/page.tsx`

```bash
# Check conflict status
git status

# Resolve conflicts (choose appropriate strategy):
git checkout --theirs app/breakaway/page.tsx
git checkout --theirs app/independent-ria/page.tsx
git checkout --theirs app/key-documents/page.tsx
git checkout --theirs app/no-to-low-aum/page.tsx

# Verify build works
npm run build

# Commit resolution
git add app/breakaway/page.tsx app/independent-ria/page.tsx app/key-documents/page.tsx app/no-to-low-aum/page.tsx
git commit -m "fix: resolve merge conflicts in training pages"
```

**Validation:** `npm run build` succeeds with no syntax errors
**Time:** 30 minutes
**Deployment Impact:** HIGH — Build completely blocked without this

---

### Fix 0.2: Move tsx to dependencies
**Issue:** RAIL-002 — Migration script requires tsx but it's in devDependencies
**Files:** `package.json`

```json
// package.json
// MOVE this line from devDependencies to dependencies:
"tsx": "^4.21.0",
```

```bash
# After editing package.json:
npm install
npm run build  # Verify build still works
```

**Validation:** `npm list tsx` shows tsx in dependencies (not devDependencies)
**Time:** 5 minutes
**Deployment Impact:** HIGH — Railway startup fails without this

---

### Fix 0.3: Fix Auth Validation (No process.exit)
**Issue:** RAIL-003 — App crashes immediately if env vars missing
**Files:** `lib/auth.ts`

```typescript
// lib/auth.ts

// Line 11 - Change from:
console.error('FATAL: NEXTAUTH_URL environment variable is not set. Example: https://yourapp.com');
process.exit(1);

// To:
throw new Error('FATAL: NEXTAUTH_URL environment variable is not set. Example: https://yourapp.com');

// Line 17 - Change from:
console.error('FATAL: NEXTAUTH_SECRET environment variable is not set. Generate one: openssl rand -base64 32');
process.exit(1);

// To:
throw new Error('FATAL: NEXTAUTH_SECRET environment variable is not set. Generate one: openssl rand -base64 32');

// Line 23 - Change from:
console.error('FATAL: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must both be set for OAuth');
process.exit(1);

// To:
throw new Error('FATAL: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must both be set for OAuth');
```

**Validation:** App shows error page instead of crashing with exit code 1
**Time:** 15 minutes
**Deployment Impact:** HIGH — Prevents cryptic Railway crashes

---

### Fix 0.4: Fix Wrong APP_URL Fallback
**Issue:** ROUTE-001 — Form links point to billing portal instead of AX
**Files:** `app/api/u4-2b/send/route.ts`, `app/api/tech-intake/send/route.ts`

```typescript
// Line 8 in BOTH files - Change from:
const APP_URL = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL ||
  'https://farther-billing-portal-production.up.railway.app';

// To:
const APP_URL = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL ||
  'https://farther-ax-production.up.railway.app';
```

**Validation:** Send test form → verify email contains correct domain
**Time:** 5 minutes
**Deployment Impact:** HIGH — Advisors can't access forms without this

---

### Fix 0.5: Install Missing Dependencies
**Issue:** ARCH-003 — 11 packages declared but not installed
**Files:** `package.json`, `node_modules/`

```bash
npm install
```

**Validation:** `npm list --depth=0` shows all packages installed
**Time:** 1 minute
**Deployment Impact:** HIGH — Build fails without dependencies

---

### Fix 0.6: Create Simple Healthcheck Endpoint
**Issue:** RAIL-005 — Current healthcheck requires HubSpot token
**Files:** Create `app/api/health/route.ts`

```typescript
// app/api/health/route.ts (NEW FILE)
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ok: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: !!process.env.DATABASE_URL
  });
}
```

Update `railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": { "builder": "NIXPACKS" },
  "deploy": {
    "startCommand": "npx tsx scripts/migrate.ts && npm start",
    "healthcheckPath": "/api/health",  // Changed from /api/command-center/health
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

**Validation:** `curl http://localhost:3000/api/health` returns 200
**Time:** 10 minutes
**Deployment Impact:** MODERATE — Prevents failed deployments due to healthcheck

---

### Fix 0.7: Add Environment Validation
**Issue:** RAIL-004 — Better to fail fast with clear error messages
**Files:** Create `lib/env-validator.ts`

```typescript
// lib/env-validator.ts (NEW FILE)
export function validateEnv() {
  const required = {
    'DATABASE_URL': 'PostgreSQL connection string',
    'NEXTAUTH_URL': 'App base URL (https://yourapp.railway.app)',
    'NEXTAUTH_SECRET': 'Secret for JWT signing (openssl rand -base64 32)',
    'GOOGLE_CLIENT_ID': 'Google OAuth client ID',
    'GOOGLE_CLIENT_SECRET': 'Google OAuth client secret',
    'HUBSPOT_ACCESS_TOKEN': 'HubSpot private app token',
  };

  const missing = Object.entries(required)
    .filter(([key]) => !process.env[key])
    .map(([key, desc]) => `  - ${key}: ${desc}`);

  if (missing.length > 0) {
    console.error('\n❌ FATAL: Missing required environment variables:\n');
    console.error(missing.join('\n'));
    console.error('\nSee .env.example for details.\n');
    throw new Error('Missing required environment variables');
  }
}
```

Call from `middleware.ts`:
```typescript
// middleware.ts - Add at top
import { validateEnv } from '@/lib/env-validator';

// Run validation only in production
if (process.env.NODE_ENV === 'production') {
  validateEnv();
}
```

**Validation:** Start app with missing env var → should show clear error
**Time:** 30 minutes
**Deployment Impact:** LOW — Improves error visibility

---

**PHASE 0 COMMIT:**
```bash
git add .
git commit -m "fix(deploy): resolve P0 blockers - merge conflicts, tsx dependency, auth validation, healthcheck

- Resolved merge conflicts in 4 training pages
- Moved tsx from devDependencies to dependencies (required for Railway migrations)
- Changed auth validation from process.exit(1) to throw Error (prevents crashes)
- Fixed APP_URL fallback to point to farther-ax (not billing portal)
- Installed missing dependencies
- Created simple /api/health endpoint (no external dependencies)
- Added env validation with clear error messages

Resolves: RAIL-001, RAIL-002, RAIL-003, ROUTE-001, ARCH-003, RAIL-005"
```

---

## 🔥 Phase 1: Critical Reliability Fixes (Week 1) — 2-3 days

### Fix 1.1: Add API Request Timeouts
**Issue:** API-001 — External API calls can hang indefinitely
**Files:** `lib/hubspot.ts`, `lib/docusign-client.ts`, `lib/aizolo.ts`, advisor routes

**Implementation:**
```typescript
// lib/api-timeout.ts (NEW FILE)
export function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = 30000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, {
    ...options,
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));
}
```

Update all API clients:
```typescript
// lib/hubspot.ts - Replace fetch with fetchWithTimeout
import { fetchWithTimeout } from './api-timeout';

async function hubspotFetch(path: string, options: RequestInit = {}) {
  const url = `https://api.hubapi.com${path}`;
  const res = await fetchWithTimeout(url, options, 30000); // 30s timeout
  // ... rest of logic
}
```

**Time:** 2 hours (create helper + update 4 files)
**Validation:** Test with slow API mock → should timeout after 30s

---

### Fix 1.2: Deduplicate HubSpot API Calls
**Issue:** DATA-001 — Pipeline deals fetched 4 times
**Files:** `lib/hubspot.ts`, `app/api/command-center/pipeline/route.ts`, `metrics/route.ts`, `warm/route.ts`, `worker/sync.ts`

**Implementation:**
```typescript
// lib/hubspot.ts - Add shared function
export async function getPipelineDeals(useCache = true): Promise<Deal[]> {
  const cacheKey = 'pipeline:deals:all';

  if (useCache) {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  }

  const deals = await paginatedSearch('/crm/v3/objects/deals/search', {
    filterGroups: [/* pipeline filter */],
    properties: [/* required props */],
  });

  // Cache for 10 minutes
  await redis.setex(cacheKey, 600, JSON.stringify(deals));
  return deals;
}
```

Update all 4 files to call `getPipelineDeals()` instead of duplicating fetch logic.

**Time:** 4 hours (create function + refactor 4 files + test)
**Validation:** Monitor HubSpot API calls → should see 1 fetch per cache window instead of 4

---

### Fix 1.3: Batch Contact Fetches (Fix N+1 Pattern)
**Issue:** DATA-002 — Fetching contacts one-by-one
**Files:** `app/api/command-center/advisor/[id]/route.ts`

**Implementation:**
```typescript
// Replace loop (lines 154-171):
// OLD:
for (const contactId of contactIds) {
  const contact = await hubspotFetch(`/crm/v3/objects/contacts/${contactId}`);
  contacts.push(contact);
}

// NEW:
import { batchRead } from '@/lib/hubspot';
const contacts = await batchRead('contacts', contactIds, ['firstname', 'lastname', 'email']);
```

**Time:** 1 hour (use existing batchRead function)
**Validation:** Advisor page load time reduces from ~800ms to ~200ms

---

### Fix 1.4: Centralize URL Construction
**Issue:** ROUTE-003 — 5 different patterns for building base URLs
**Files:** Create `lib/app-url.ts`, update 18 files

**Implementation:**
```typescript
// lib/app-url.ts (NEW FILE)
export function getAppBaseUrl(): string {
  // Railway production
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  }

  // Explicit override
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }

  // Local development
  return 'http://localhost:3000';
}

export function getCallbackUrl(path: string): string {
  return `${getAppBaseUrl()}${path}`;
}
```

Update 18 files to use helper:
```typescript
// Before:
const APP_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

// After:
import { getAppBaseUrl } from '@/lib/app-url';
const APP_URL = getAppBaseUrl();
```

**Time:** 2 hours (create helper + refactor 18 files)
**Validation:** Test in local, staging, and production → URLs correct in all environments

---

**PHASE 1 COMMIT:**
```bash
git add .
git commit -m "fix(reliability): add API timeouts, deduplicate fetches, batch reads, centralize URLs

- Added fetchWithTimeout helper (30s default) to prevent hanging requests
- Created getPipelineDeals() to eliminate duplicate HubSpot fetches (50% API reduction)
- Migrated advisor detail to batch contact reads (4x faster)
- Centralized URL construction in lib/app-url.ts (single source of truth)

Resolves: API-001, DATA-001, DATA-002, ROUTE-003"
```

---

## 🧪 Phase 2: Test Coverage (Week 2) — 3-4 days

### Fix 2.1: Install Missing Test Dependency
**Issue:** TEST-001 — Tests cannot run
**Files:** `package.json`

```bash
npm install --save-dev jest-environment-jsdom
```

**Time:** 2 minutes

---

### Fix 2.2: Create Smoke Tests for Critical Flows
**Issue:** TEST-004 — No automated verification of critical paths
**Files:** Create `__tests__/smoke/` directory

```typescript
// __tests__/smoke/health.test.ts
describe('Health Check', () => {
  it('should return 200 and valid structure', async () => {
    const res = await fetch('http://localhost:3000/api/health');
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('ok', true);
    expect(data).toHaveProperty('timestamp');
  });
});

// __tests__/smoke/auth.test.ts
describe('Auth Restriction', () => {
  it('should reject non-@farther.com emails', () => {
    // Test signIn callback
  });
});

// __tests__/smoke/pipeline.test.ts
describe('Pipeline API', () => {
  it('should load deals from database or HubSpot', async () => {
    const res = await fetch('http://localhost:3000/api/command-center/pipeline');
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });
});
```

**Time:** 4 hours (5 smoke tests)
**Validation:** `npm test` runs successfully

---

### Fix 2.3: Test DocuSign Webhook Security
**Issue:** TEST-002 — HMAC verification untested
**Files:** Create `__tests__/api/webhooks/docusign.test.ts`

```typescript
describe('DocuSign Webhook', () => {
  it('should reject requests with invalid HMAC', async () => {
    // Mock webhook payload with wrong signature
    const res = await fetch('http://localhost:3000/api/webhooks/docusign', {
      method: 'POST',
      headers: { 'x-docusign-signature-1': 'invalid-signature' },
      body: JSON.stringify({ event: 'envelope-completed' }),
    });
    expect(res.status).toBe(401);
  });

  it('should accept requests with valid HMAC', async () => {
    // Mock webhook payload with correct signature
    // ...
  });

  it('should update database for completed envelopes', async () => {
    // Mock valid webhook → verify DB update
    // ...
  });
});
```

**Time:** 1 day (comprehensive webhook testing)
**Validation:** Tests pass, coverage includes signature validation

---

### Fix 2.4: Document Database Rollback
**Issue:** TEST-003 — No rollback procedure
**Files:** Create `DATABASE_ROLLBACK.md`

```markdown
# Database Rollback Procedure

## When to Use
If a migration fails on Railway deploy and corrupts production data.

## Rollback Steps
1. Stop Railway deployment: `railway down`
2. Connect to database: `railway connect postgres`
3. Check migration status: `SELECT * FROM pg_tables WHERE schemaname = 'public';`
4. Run rollback script: `\i database/rollback/001_rollback_agents.sql`
5. Redeploy previous Railway version
6. Verify health: `GET /api/health`

## Prevention
- Always test migrations in staging first
- Back up database before major migrations
- Add migration versioning table
```

**Time:** 1 hour (document + create rollback scripts)
**Validation:** Test rollback in staging environment

---

**PHASE 2 COMMIT:**
```bash
git add .
git commit -m "test: add smoke tests, webhook security tests, rollback documentation

- Installed jest-environment-jsdom to enable test runs
- Created smoke tests for 5 critical flows (health, auth, pipeline, transitions, checklist)
- Added comprehensive DocuSign webhook tests (HMAC verification, DB updates)
- Documented database rollback procedure in DATABASE_ROLLBACK.md

Resolves: TEST-001, TEST-002, TEST-003, TEST-004"
```

---

## 🏗️ Phase 3: Architecture Cleanup (Week 3-4) — 5-7 days

### Fix 3.1: Split God Components
**Issue:** ARCH-001 — 2,330-line command center page
**Files:** `app/command-center/page.tsx`

**Strategy:**
1. Extract tab components: `RecruitingTab.tsx`, `AcquisitionsTab.tsx`
2. Extract shared components: `DealTable.tsx`, `FunnelChart.tsx`
3. Extract hooks: `useDealAnalytics.ts`, `useFunnelMetrics.ts`
4. Target: All components <200 lines

**Time:** 3-5 days (major refactoring)
**Validation:** All features work, page load time unchanged or improved

---

### Fix 3.2: Centralize Type Definitions
**Issue:** ARCH-009 — 12 different Deal type definitions
**Files:** Create `lib/types/` directory

```typescript
// lib/types/hubspot.ts
export interface Deal {
  id: string;
  properties: {
    dealname: string;
    amount: string;
    closedate: string;
    dealstage: string;
    // ... canonical definition
  };
}

// lib/types/index.ts
export * from './hubspot';
export * from './docusign';
export * from './app';
```

Delete all duplicate type definitions, import from centralized location.

**Time:** 1-2 days
**Validation:** `npx tsc --noEmit` passes, no type errors

---

### Fix 3.3: Fix Pre-Commit Hooks
**Issue:** TEST-005 — Quality gates disabled
**Files:** `.husky/pre-commit`

```bash
# .husky/pre-commit - Remove all || true

#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Lint with zero tolerance
npm run lint -- --max-warnings=0

# Type check
npx tsc --noEmit

# Run tests
npm test -- --bail --findRelatedTests $@
```

**Time:** 4 hours (fix warnings + enable hooks)
**Validation:** Pre-commit blocks bad code from reaching main

---

**PHASE 3 COMMIT:**
```bash
git add .
git commit -m "refactor: split god components, centralize types, enforce quality gates

- Split command-center page (2,330 lines) into <200 line components
- Created lib/types/ with canonical HubSpot, DocuSign, App types
- Deleted 12 duplicate type definitions
- Enabled pre-commit hooks (removed || true)
- Fixed ESLint warnings, TypeScript errors

Resolves: ARCH-001, ARCH-009, TEST-005"
```

---

## ⚡ Phase 4: Performance Optimization (Week 4-5) — 3-4 days

### Fix 4.1: Implement Webhook-First Architecture
**Issue:** DATA-003 — Polling every 5 minutes wasteful
**Files:** `app/api/webhooks/hubspot/route.ts`, `worker/sync.ts`

**Strategy:**
1. Enable HubSpot webhooks (follow CACHE-SETUP.md)
2. Implement Google Drive Push Notifications
3. Make DocuSign webhooks primary sync mechanism
4. Reduce cron from 5 min to 30 min (reconciliation only)

**Time:** 2-3 days
**Validation:** 80% reduction in background API calls

---

### Fix 4.2: Batch Database Operations
**Issue:** DATA-005 — Individual row upserts in transitions sync
**Files:** `app/api/command-center/transitions/sync/route.ts`

**Strategy:**
Replace 1 INSERT per row with batch INSERT using unnest() arrays.

**Time:** 1 day
**Validation:** 90% reduction in DB round-trips, faster sync

---

**PHASE 4 COMMIT:**
```bash
git add .
git commit -m "perf: webhook-first architecture, batch DB operations

- Enabled HubSpot webhooks for real-time updates
- Implemented Google Drive Push Notifications for Sheets changes
- Made DocuSign webhooks primary sync (not polling)
- Reduced cron from 5 min to 30 min
- Batched transitions row upserts (90% fewer DB calls)

Resolves: DATA-003, DATA-005"
```

---

## 📊 Success Metrics

**After implementing all phases:**

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Build success rate | 0% (blocked) | 100% | ✅ Unblocked |
| API call count (daily) | ~2,000 | ~400 | -80% |
| Advisor page load time | 800ms | 200ms | 4x faster |
| Test coverage | 0% | 60% | ✅ Safety net |
| God component lines | 2,330 | <200 | 10x more maintainable |
| Type safety (any count) | 48 | 0 | ✅ Full type coverage |

---

## Deployment Strategy

### Staging Deployment (After Phase 0-1)
1. Deploy to Railway staging environment
2. Run smoke tests
3. Manual QA: pipeline, checklist, transitions
4. Verify 24 hours with no errors

### Production Deployment (After Phase 0-2)
1. Deploy Phase 0-1 fixes to production
2. Monitor closely for 24 hours
3. Deploy Phase 2 (tests) as additive (no user impact)
4. Monitor error rates, API usage

### Gradual Rollout (Phase 3-4)
1. Deploy architecture refactors incrementally (feature flags if needed)
2. A/B test performance improvements
3. Monitor metrics: response time, error rate, API quota

---

**Estimated Timeline:**
- **Phase 0 (Blockers):** 90 minutes → Deploy immediately
- **Phase 1 (Reliability):** 2-3 days → Deploy within 1 week
- **Phase 2 (Tests):** 3-4 days → Deploy within 2 weeks
- **Phase 3 (Architecture):** 5-7 days → Deploy within 4 weeks
- **Phase 4 (Performance):** 3-4 days → Deploy within 6 weeks

**Total:** 6-8 weeks to complete all phases
