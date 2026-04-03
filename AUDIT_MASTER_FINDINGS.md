# Farther AX — Master Code Audit Findings

**Date:** 2026-04-03
**Auditors:** 6 specialized agents (Architecture, API, Railway, Data, Route, Test)

---

## P0 — CRITICAL (Deployment Blockers)

| ID | Source | Issue | Files | Fix | Effort |
|--- |--------|-------|-------|-----|--------|
| **RAIL-001** | Railway | Merge conflicts prevent build | 4 files (breakaway, independent-ria, key-documents, no-to-low-aum pages) | Resolve conflicts, test build | M (30 min) |
| **RAIL-002** | Railway | `tsx` in devDependencies, needed in production start command | package.json | Move tsx to dependencies | S (5 min) |
| **RAIL-003** | Railway | Auth validation calls `process.exit(1)` on missing env vars | lib/auth.ts | Change to `throw new Error(...)` | S (15 min) |
| **ROUTE-001** | Route | Wrong fallback APP_URL points to billing portal | u4-2b/send, tech-intake/send routes | Change to farther-ax URL | S (5 min) |
| **ARCH-003** | Architecture | 11 missing dependencies declared in package.json | package.json, node_modules | Run `npm install` | S (1 min) |
| **TEST-001** | Test | Zero API route test coverage (68 endpoints untested) | All API routes | Create smoke tests for top 10 critical endpoints | L (2-3 days) |
| **TEST-002** | Test | DocuSign webhook HMAC verification untested | webhooks/docusign route | Add tests for signature validation + DB updates | M (1 day) |

---

## P1 — HIGH (Major Reliability/Performance Issues)

| ID | Source | Issue | Files | Fix | Effort |
|----|--------|-------|-------|-----|--------|
| **API-001** | API | Missing request timeouts on external API calls | lib/docusign, lib/aizolo, advisor routes | Add AbortController with 30s timeout | M |
| **API-002** | API | Direct `fetch()` calls bypass HubSpot retry client | 3+ routes | Migrate to `hubspotFetch()` | M |
| **DATA-001** | Data | Redundant HubSpot API calls across routes | pipeline, metrics, warm, worker/sync | Create shared `getPipelineDeals()` function | S |
| **DATA-002** | Data | N+1 query pattern fetching advisor contacts | advisor/[id] route, warm route | Use HubSpot batch read API | M |
| **RAIL-005** | Railway | Healthcheck endpoint requires HubSpot token | command-center/health route | Create simple `/api/health` without dependencies | S (10 min) |
| **ARCH-001** | Architecture | God components (2,330 lines) | command-center page, advisor page | Split into <200 line components | L (3-5 days) |
| **ARCH-002** | Architecture | Massive code duplication (`fetcher`, `formatAUM`, Deal types) | 10+ files | Create shared utilities in lib/ | M (2-3 days) |
| **TEST-005** | Test | Pre-commit hooks allow all failures (`|| true`) | .husky/pre-commit | Remove `|| true`, fix warnings | S (4 hours) |

---

## P2 — MEDIUM (Maintainability/UX Issues)

| ID | Source | Issue | Files | Fix | Effort |
|----|--------|-------|-------|-----|--------|
| **DATA-003** | Data | Polling-based sync instead of webhook-first | worker/sync, transitions/sync | Implement HubSpot webhooks, Google Drive Push Notifications | L |
| **DATA-004** | Data | Overlapping cache layers with inconsistent TTLs | api-cache, pg-cache, redis-client | Consolidate into `lib/cache-config.ts` | S |
| **API-003** | API | DocuSign token table accumulates indefinitely | lib/docusign-client | Add cleanup: DELETE tokens older than 7 days | S |
| **ROUTE-002** | Route | Placeholder external links in Sidebar ("#") | components/Sidebar | Remove or replace with real URLs | S (10 min) |
| **ROUTE-003** | Route | 5 different URL construction patterns | 18 files | Create centralized `lib/app-url.ts` helper | M (2 hours) |
| **ROUTE-005** | Route | 18 generic/fake resource URLs in onboarding tasks | lib/onboarding-tasks-v2 | Audit with AX team, get real URLs | L (4 hours) |
| **ARCH-004** | Architecture | Weak error handling (only 30% API routes have try-catch) | 68 API routes | Add centralized error wrapper | M (2-3 days) |
| **ARCH-005** | Architecture | 48 `: any` types defeating TypeScript | lib/ directory | Replace with proper interfaces or `unknown` | M (2 days) |
| **TEST-003** | Test | No database migration rollback documentation | scripts/migrate.ts | Create DATABASE_ROLLBACK.md + test procedure | M (1 day) |

---

## P3 — LOW (Cleanup/Polish)

| ID | Source | Issue | Files | Fix | Effort |
|----|--------|-------|-------|-----|--------|
| **DATA-007** | Data | Unused Prisma ORM (dead code) | lib/prisma.ts | Remove file + dependency | S |
| **DATA-006** | Data | No cache warming after Railway deploy | No deploy hook | Add warm endpoint to Railway deploy command | S |
| **API-009** | API | Retry logic ignores Retry-After header | lib/hubspot, lib/docusign | Parse header, use max(retryAfter, exponentialBackoff) | S |
| **ROUTE-007** | Route | No custom 404 page | No app/not-found.tsx | Create branded 404 page | S (30 min) |
| **ARCH-008** | Architecture | Database pool may be undersized (max: 10) | lib/db.ts | Make configurable via env var, increase to 20 | S (10 min) |
| **ARCH-009** | Architecture | No centralized type library | No lib/types/ directory | Create lib/types/ with canonical types | S (1-2 days) |

---

## Quick Win Summary

**Total Time: 90 minutes | Impact: Unblocks deployment + prevents production crashes**

1. **Resolve merge conflicts** (30 min) → Enables build
2. **Move `tsx` to dependencies** (5 min) → Enables migrations
3. **Fix auth validation** (15 min) → Prevents startup crashes
4. **Fix APP_URL fallback** (5 min) → Fixes form links
5. **Create simple healthcheck** (10 min) → Passes Railway checks
6. **Install missing dependencies** (1 min) → Fixes build
7. **Add env validation** (30 min) → Fail fast on deploy

---

## Strategic Improvement Summary

**Phase 1: Stabilization (Week 1)**
- Deduplicate HubSpot fetch logic
- Add API timeouts
- Fix error handling in top 10 routes
- Create shared formatters/types

**Phase 2: Test Coverage (Week 2-3)**
- Add smoke tests for 5 critical flows
- Test DocuSign webhook security
- Test HubSpot retry logic
- Test auth flow
- Target: 60% coverage

**Phase 3: Architecture Refactor (Week 3-4)**
- Split god components into <200 line files
- Extract API route logic to lib/services
- Implement Tailwind component library
- Remove inline styles

**Phase 4: Performance (Week 4-5)**
- Implement webhook-first architecture
- Batch database operations
- Consolidate cache layers
- Add cache warming

---

## Cross-Cutting Recommendations

### Immediate Actions (Before Next Deploy)
1. ✅ Fix 4 P0 blocking issues (RAIL-001, RAIL-002, RAIL-003, ROUTE-001)
2. ✅ Install missing dependencies
3. ✅ Create smoke tests for healthcheck + auth
4. ✅ Document rollback procedure
5. ✅ Test in staging environment

### Short-Term (1-2 Weeks)
1. Add comprehensive test coverage (60% minimum)
2. Deduplicate code (fetcher, formatters, types)
3. Add API timeouts + retry consistency
4. Enable webhook-first architecture
5. Fix pre-commit hooks

### Long-Term (1-2 Months)
1. Refactor god components
2. Build Tailwind component library
3. Implement performance monitoring
4. Add E2E tests for critical flows
5. Migrate to Prisma or versioned migrations

---

## Validation Checklist

### Pre-Deploy
- [ ] All merge conflicts resolved
- [ ] `npm install` runs successfully
- [ ] `npm run build` succeeds with no errors
- [ ] `npx tsc --noEmit` passes with no errors
- [ ] `npm test` runs (even if coverage is low)
- [ ] Database migrations tested in staging
- [ ] All critical env vars set in Railway
- [ ] Healthcheck endpoint returns 200

### Post-Deploy
- [ ] Railway deployment succeeds
- [ ] Health endpoint returns 200
- [ ] Pipeline dashboard loads
- [ ] Advisor checklist loads
- [ ] Transitions dashboard loads
- [ ] DocuSign webhook processes test envelope
- [ ] No startup errors in Railway logs
- [ ] Database connection pool stable

---

**Report Generated:** 2026-04-03
**Next Review:** After implementing P0 + P1 fixes
