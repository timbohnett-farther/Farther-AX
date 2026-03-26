# Data Loading SWAT Plan

**Project**: Farther AX Command Center
**Created**: 2026-03-26
**Priority**: CRITICAL
**Status**: Planning

---

## Problem Statement

Pages that load data from HubSpot (Pipeline, Advisor Hub, Transitions, etc.) fail on initial load and require 2-3 manual refreshes before data appears. Users returning after 10 minutes face the same cold-start issue. This kills user engagement and trust.

---

## Root Cause Analysis

### Why Pages Fail on First Load

1. **No global prefetching** — `layout.tsx` has no `SWRConfig` provider and no data preloading. Every page independently fires its own `useSWR` calls on mount.
2. **HubSpot API is slow** — Pipeline endpoint hits HubSpot search API which takes 2-5 seconds. Multiple pages fire this same call independently.
3. **No stale-while-revalidate at the client level** — Pages show nothing while waiting for fresh data because `keepPreviousData` only works if there IS previous data in the SWR cache (there isn't on first visit).
4. **Server-side cache (pg-cache) has 2-hour TTL** — If nobody has visited in 2+ hours, the first visitor triggers a cold HubSpot fetch for every endpoint.
5. **Advisor detail pages fire 9 useSWR calls with DEFAULT config** — No `revalidateOnFocus: false`, no `dedupingInterval`, causing redundant fetches.

### Why Returning Users Also Wait

6. **SWR in-memory cache is lost on page close** — SWR stores cache in JavaScript memory. Closing the tab or navigating away clears it entirely.
7. **No persistent client-side cache** — No `localStorage`, `sessionStorage`, or IndexedDB cache layer. Every tab/session starts cold.
8. **Inconsistent refresh intervals** — Dashboard: 8hrs, RIA Hub: 5min, Alerts: 5min, Metrics: 12hrs. No coordination.

### Duplicate API Calls Across Pages

| Endpoint | Called From |
|----------|------------|
| `/api/command-center/pipeline` | Dashboard, Advisor Hub, Onboarding, Advisor Detail (4x) |
| `/api/command-center/sentiment/scores` | Dashboard, Advisor Hub, Alerts (3x) |
| `/api/command-center/aum-tracker` | Dashboard (2 variants), Advisor Hub (3x) |
| `/api/command-center/alerts` | Alerts page, Sidebar (2x) |

---

## The Fix: 3-Layer Caching Architecture

### Layer 1: Server-Side (PostgreSQL Cache) — Already Exists, Needs Tuning

**Current state**: `withPgCache()` with 2-hour TTL. Falls back to stale data.

**Changes needed**:
- Increase default TTL from 2 hours to **8 hours** for stable data (pipeline, metrics, team)
- Keep 2-hour TTL for volatile data (sentiment, alerts)
- Add pg-cache to ALL routes that currently hit DB without caching:
  - `/api/command-center/sentiment/scores` — ADD withPgCache (2hr TTL)
  - `/api/command-center/alerts` — ADD withPgCache (2hr TTL)
  - `/api/command-center/team` — ADD withPgCache (8hr TTL)
  - `/api/command-center/workload` — ADD withPgCache (4hr TTL)
  - `/api/command-center/transitions` — ADD withPgCache (2hr TTL)
  - `/api/command-center/transitions/stats` — ADD withPgCache (2hr TTL)

### Layer 2: Global SWR Provider — NEW

Wrap the entire app in `SWRConfig` with a persistent cache provider that uses `localStorage`.

**Implementation** — Add to `app/layout.tsx`:

```tsx
// lib/swr-provider.tsx
'use client';

import { SWRConfig } from 'swr';

function localStorageProvider() {
  const map = new Map<string, any>(
    JSON.parse(localStorage.getItem('swr-cache') || '[]')
  );

  window.addEventListener('beforeunload', () => {
    const appCache = JSON.stringify(Array.from(map.entries()));
    localStorage.setItem('swr-cache', appCache);
  });

  return map;
}

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        provider: typeof window !== 'undefined' ? localStorageProvider : undefined,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 3600000, // 1 hour global dedup
        keepPreviousData: true,
        errorRetryCount: 2,
        fetcher: (url: string) => fetch(url).then(r => {
          if (!r.ok) throw new Error(`API error: ${r.status}`);
          return r.json();
        }),
      }}
    >
      {children}
    </SWRConfig>
  );
}
```

**Effect**:
- ALL useSWR calls share one cache
- Cache persists to `localStorage` on tab close
- Returning user in 10 minutes sees INSTANT cached data
- SWR revalidates in the background (stale-while-revalidate)
- Global `revalidateOnFocus: false` prevents refetch storms

### Layer 3: Background Prefetch on App Entry — NEW

When the app loads (any page), immediately warm ALL critical endpoints in the background so data is ready before the user navigates.

**Implementation** — Add to `app/layout.tsx` or a client component:

```tsx
// lib/prefetch.tsx
'use client';

import { useEffect } from 'react';
import { mutate } from 'swr';

const CRITICAL_ENDPOINTS = [
  '/api/command-center/pipeline',
  '/api/command-center/aum-tracker',
  '/api/command-center/sentiment/scores',
  '/api/command-center/alerts',
  '/api/command-center/team',
  '/api/command-center/metrics',
  '/api/command-center/complexity/scores',
];

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function Prefetcher() {
  useEffect(() => {
    // Fire all critical fetches in parallel on app entry
    // SWR's global cache will store results for any page that needs them
    CRITICAL_ENDPOINTS.forEach(url => {
      mutate(url, fetcher(url), { revalidate: false });
    });
  }, []);

  return null; // Invisible component
}
```

**Effect**:
- User lands on ANY page → all critical data fetches fire immediately
- By the time they click to Pipeline or Advisor Hub, data is already cached
- No duplicate fetches because SWR deduplicates by key

---

## Execution Plan

### Phase 1: Global SWR Provider + Persistent Cache (Highest Impact)

| Step | Task | File(s) |
|------|------|---------|
| 1.1 | Create `lib/swr-provider.tsx` with localStorage cache provider | NEW |
| 1.2 | Create `lib/prefetch.tsx` background prefetcher | NEW |
| 1.3 | Wrap app in `SWRProvider` + add `Prefetcher` to layout | `app/layout.tsx` |
| 1.4 | Remove per-page `fetcher` definitions (use global) | All 10 page files |
| 1.5 | Remove per-page `SWR_OPTS` (use global config) | Dashboard, Advisor Hub |
| 1.6 | Standardize all page-level useSWR to use global defaults | All command-center pages |

**Expected result**: Returning users see instant data. First-time users see data within 1-2 seconds of app entry.

### Phase 2: Fix Advisor Detail Page (9 Unoptimized SWR Calls)

| Step | Task | File(s) |
|------|------|---------|
| 2.1 | Add explicit SWR config to all 9 useSWR calls | `app/command-center/advisor/[id]/page.tsx` |
| 2.2 | Set `revalidateOnFocus: false` and `keepPreviousData: true` | Same |
| 2.3 | Add shimmer loading states instead of blank screen | Same |

### Phase 3: Server-Side Cache Expansion

| Step | Task | File(s) |
|------|------|---------|
| 3.1 | Add withPgCache to `/api/command-center/sentiment/scores` (2hr) | Route file |
| 3.2 | Add withPgCache to `/api/command-center/alerts` (2hr) | Route file |
| 3.3 | Add withPgCache to `/api/command-center/team` (8hr) | Route file |
| 3.4 | Add withPgCache to `/api/command-center/workload` (4hr) | Route file |
| 3.5 | Add withPgCache to all transitions query endpoints (2hr) | 5 route files |
| 3.6 | Increase pipeline/metrics/aum-tracker TTL from 2hr to 8hr | 3 route files |

### Phase 4: Auto-Warm on Deploy

| Step | Task | File(s) |
|------|------|---------|
| 4.1 | Add health check that triggers `/api/command-center/warm` on startup | `app/api/health/route.ts` |
| 4.2 | Or add Railway deploy hook that calls warm endpoint after deploy | `railway.json` |

**Expected result**: After a Railway deploy, cache is pre-populated before any user visits.

---

## Success Criteria

| Metric | Current | Target |
|--------|---------|--------|
| First page load (cold) | 3-8 seconds, often fails | < 2 seconds, no failures |
| First page load (warm cache) | 3-8 seconds (no persistence) | < 200ms (instant from localStorage) |
| Return visit after 10 min | Full reload, multiple refreshes | Instant (cached), background revalidate |
| Navigate between pages | Each page loads independently | Instant (prefetched in background) |
| After Railway deploy | Cold start, all caches empty | Pre-warmed within 30 seconds |

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| localStorage exceeds 5MB limit | Add size check; evict oldest entries if near limit |
| Stale data shown too long | SWR still revalidates in background; user sees fresh data within seconds |
| HubSpot rate limits during prefetch | Prefetcher uses server-side pg-cache; only cold-cache triggers HubSpot calls |
| localStorage not available (private browsing) | SWRConfig provider gracefully falls back to in-memory cache |

---

## Files to Create/Modify

### New Files
- `lib/swr-provider.tsx` — Global SWR config with localStorage persistence
- `lib/prefetch.tsx` — Background data prefetcher component

### Modified Files
- `app/layout.tsx` — Wrap in SWRProvider, add Prefetcher
- `app/command-center/page.tsx` — Remove local SWR_OPTS and fetcher
- `app/command-center/advisor-hub/page.tsx` — Remove local SWR_OPTS and fetcher
- `app/command-center/transitions/page.tsx` — Remove local fetcher
- `app/command-center/advisor/[id]/page.tsx` — Add SWR config, shimmer states
- `app/command-center/onboarding/page.tsx` — Remove local fetcher
- `app/command-center/team/page.tsx` — Remove local fetcher
- `app/command-center/metrics/page.tsx` — Remove local fetcher
- `app/command-center/ria-hub/page.tsx` — Remove local fetcher
- `app/command-center/alerts/page.tsx` — Remove local fetcher
- `app/command-center/ai/page.tsx` — Remove local fetcher (if present)
- `app/api/command-center/sentiment/scores/route.ts` — Add withPgCache
- `app/api/command-center/alerts/route.ts` — Add withPgCache
- `app/api/command-center/team/route.ts` — Add withPgCache
- `app/api/command-center/workload/route.ts` — Add withPgCache
- `app/api/command-center/transitions/route.ts` — Add withPgCache
- Various transition sub-routes — Add withPgCache
