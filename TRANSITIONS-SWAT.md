# Transitions Dashboard SWAT Plan

**Project**: Farther AX Command Center — Transitions Pipeline
**Created**: 2026-03-26
**Priority**: CRITICAL
**Status**: Planning → Implementation

---

## Problem Statement

The Transitions dashboard works intermittently. Data loads sometimes, then stops. Users have to refresh multiple times. The sync mechanism is fragile — it depends on a cascade of Google Drive API → Google Sheets API → PostgreSQL writes, and any single failure in that chain silently breaks the whole page.

**Required end state**: Data syncs automatically every 2 hours, only changed rows are updated, manual sync is instant and reliable, and the page always shows cached data on load.

---

## Specialist Team

| Codename | Domain | Focus |
|----------|--------|-------|
| **ATLAS** | Google APIs | Drive file listing, Sheets data reads, auth token lifecycle, rate limiting |
| **FORGE** | Data Pipeline | Sheet → DB transformation, upsert logic, incremental sync, change detection |
| **VAULT** | Database | Connection pooling, query optimization, transaction safety, schema integrity |
| **SENTINEL** | Reliability | Error isolation, retry logic, health checks, sync status monitoring |
| **CHRONOS** | Scheduling | Auto-sync timing, cooldown management, timestamp tracking, edit log diffing |

---

## Root Cause Analysis

### Why the Dashboard Stops Working

| # | Cause | Evidence | Impact |
|---|-------|----------|--------|
| 1 | **Google Auth token expiry** — service account tokens expire after 1 hour; no automatic refresh retry | `getAccessToken()` has no retry or token caching | Entire sync fails silently |
| 2 | **No error isolation** — if one sheet fails to parse, the entire sync returns an error | Sequential sync with no per-sheet try/catch in the caller loop | All data appears stale |
| 3 | **Google Sheets API rate limits** — 60 read requests/min per project; syncing 15+ sheets hits this | No rate limiting or backoff between sheet reads | 429 errors kill the sync |
| 4 | **DB connection pool exhaustion** — each row upsert uses a connection; 500+ rows in a single sync | No batched inserts, no transaction wrapping | Connection timeout errors |
| 5 | **Auto-sync race conditions** — page load triggers auto-sync if data >2hrs old; multiple tabs = multiple syncs | No distributed lock; cooldown only on sync-all endpoint | Duplicate syncs, DB deadlocks |
| 6 | **Silent failure mode** — `if (!res.ok) break` in API calls returns no error to the caller | No error logging, no user-facing error state | Page shows blank with no explanation |
| 7 | **Full re-sync every time** — sync reads ALL rows from ALL sheets regardless of changes | No timestamp comparison, no change detection | Slow, wasteful, rate-limit-prone |

---

## The Fix: Incremental Sync with Change Detection

### Architecture Overview

```
Google Sheets (shared drive)
    │
    ├── Sheet modified? ──── Check via Drive API `modifiedTime`
    │                         vs. `transition_workbooks.last_synced_at`
    │
    ├── YES → Fetch sheet data
    │         ├── Compare row checksums vs. stored checksums
    │         ├── UPSERT only changed/new rows
    │         └── DELETE removed rows (soft delete)
    │
    └── NO → Skip (no API call to Sheets)

PostgreSQL (data store)
    │
    └── transition_clients table
        ├── row_checksum (MD5 of all field values)
        ├── last_synced_at (per-row timestamp)
        └── sync_batch_id (groups rows by sync run)
```

---

## Implementation Plan

### Phase 1: SENTINEL — Error Isolation & Reliability

**Goal**: The sync should never fully crash. Individual sheet failures are isolated.

| Step | Task | File(s) |
|------|------|---------|
| 1.1 | Add try/catch around EACH sheet sync in the folder loop | `transitions/sync/route.ts` |
| 1.2 | Cache Google Auth token with TTL (50 min) and auto-refresh | `lib/google-sheets.ts` |
| 1.3 | Add exponential backoff retry (3 attempts) on Google API calls | `lib/google-sheets.ts` |
| 1.4 | Add structured error logging with `[transitions/sync]` prefix | All transition routes |
| 1.5 | Return partial results on partial failure (include error details per sheet) | `transitions/sync/route.ts` |
| 1.6 | Add sync status tracking in DB (`sync_runs` table with status, error_count, started_at, completed_at) | `scripts/migrate-transitions.ts` |

### Phase 2: CHRONOS — Incremental Change Detection

**Goal**: Only sync sheets that changed since last pull. Only update rows that changed.

| Step | Task | File(s) |
|------|------|---------|
| 2.1 | Before syncing, check `modifiedTime` from Drive API vs `last_synced_at` in `transition_workbooks` | `transitions/sync/route.ts` |
| 2.2 | Skip sheets where `modifiedTime <= last_synced_at` (no changes) | Same |
| 2.3 | Add `row_checksum` column to `transition_clients` (MD5 hash of all field values) | `scripts/migrate-transitions.ts` |
| 2.4 | On sync: compute checksum for each row, compare with stored checksum | `transitions/sync/route.ts` |
| 2.5 | Only UPSERT rows where checksum differs (changed) or is new | Same |
| 2.6 | Add `sync_batch_id` to track which rows were touched in each sync run | Same |
| 2.7 | Log sync stats: `{total_rows, unchanged, updated, new, removed}` | Same |

**Sync behavior**:
- **Auto-sync (every 2 hours)**: Check all sheets' `modifiedTime`, only sync changed ones, only update changed rows
- **Manual "Sync All"**: Check all sheets' `modifiedTime`, sync changed ones, update changed rows
- **Manual "Sync Sheet #X"**: Force-sync that specific sheet regardless of `modifiedTime`, update changed rows

### Phase 3: ATLAS — Google API Hardening

**Goal**: Never hit rate limits. Never fail on auth.

| Step | Task | File(s) |
|------|------|---------|
| 3.1 | Cache auth token in memory with 50-minute TTL (tokens last 60 min) | `lib/google-sheets.ts` |
| 3.2 | Add rate limiter: max 50 Sheets API calls per minute (below 60/min limit) | `lib/google-sheets.ts` |
| 3.3 | Add request timeout (30 seconds) via AbortController on all Google API calls | `lib/google-sheets.ts` |
| 3.4 | Retry failed API calls with exponential backoff: 1s, 2s, 4s (max 3 retries) | `lib/google-sheets.ts` |
| 3.5 | If auth fails, attempt full token refresh before retrying | `lib/google-sheets.ts` |

### Phase 4: VAULT — Database Optimization

**Goal**: Fast writes, no connection exhaustion, transactional safety.

| Step | Task | File(s) |
|------|------|---------|
| 4.1 | Batch upserts: build one multi-row INSERT...ON CONFLICT per sheet instead of per row | `transitions/sync/route.ts` |
| 4.2 | Wrap each sheet's upserts in a transaction (all-or-nothing per sheet) | Same |
| 4.3 | Add connection pool monitoring (log pool.totalCount, pool.idleCount, pool.waitingCount) | `lib/db.ts` |
| 4.4 | Set statement timeout to 30s to prevent long-running queries from blocking pool | `lib/db.ts` |

### Phase 5: FORGE — Auto-Sync Scheduler

**Goal**: Reliable 2-hour auto-sync that doesn't depend on page visits.

| Step | Task | File(s) |
|------|------|---------|
| 5.1 | Create `/api/command-center/transitions/auto-sync` endpoint for cron/scheduled calls | NEW route |
| 5.2 | Add distributed lock via DB: `sync_lock` row in `api_cache` with 10-minute TTL | Same |
| 5.3 | Auto-sync checks lock before starting; skips if another sync is running | Same |
| 5.4 | Add Railway cron job or health-check-triggered sync every 2 hours | `railway.json` or health route |
| 5.5 | Page load no longer triggers sync — it only reads from DB (always fast) | `transitions/page.tsx` |

---

## Database Schema Changes

### New column: `transition_clients.row_checksum`
```sql
ALTER TABLE transition_clients
ADD COLUMN IF NOT EXISTS row_checksum VARCHAR(32);

ALTER TABLE transition_clients
ADD COLUMN IF NOT EXISTS sync_batch_id VARCHAR(64);
```

### New table: `sync_runs`
```sql
CREATE TABLE IF NOT EXISTS sync_runs (
  id            SERIAL PRIMARY KEY,
  sync_type     VARCHAR(32) NOT NULL,  -- 'auto', 'manual_all', 'manual_single'
  status        VARCHAR(16) NOT NULL,  -- 'running', 'completed', 'partial', 'failed'
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at  TIMESTAMPTZ,
  total_sheets  INTEGER DEFAULT 0,
  synced_sheets INTEGER DEFAULT 0,
  failed_sheets INTEGER DEFAULT 0,
  total_rows    INTEGER DEFAULT 0,
  updated_rows  INTEGER DEFAULT 0,
  new_rows      INTEGER DEFAULT 0,
  unchanged_rows INTEGER DEFAULT 0,
  error_details JSONB,
  triggered_by  VARCHAR(255)
);
```

---

## Incremental Sync Algorithm

```
FUNCTION syncSheet(sheetId):
  1. Fetch sheet modifiedTime from Google Drive API
  2. IF modifiedTime <= workbook.last_synced_at:
       RETURN { status: 'skipped', reason: 'no changes' }

  3. Fetch sheet data from Google Sheets API (range: Transition!A1:AQ)
  4. Parse headers, build field map

  5. FOR EACH data row:
       a. Compute row_checksum = MD5(all field values joined)
       b. Look up existing row by (sheet_id, sheet_row_index)
       c. IF existing AND existing.row_checksum == new checksum:
            Mark as unchanged, SKIP
       d. ELSE:
            Add to upsert batch (new or changed)

  6. Execute batched UPSERT (one statement, all changed rows)
  7. Update transition_workbooks.last_synced_at = NOW()
  8. Log sync_run with stats

  RETURN { synced, unchanged, new, updated }
```

---

## Success Criteria

| Metric | Current | Target |
|--------|---------|--------|
| Sync reliability | ~60% (intermittent failures) | 99%+ (error isolation) |
| Full folder sync time | 30-60 seconds (all rows) | 5-10 seconds (only changed rows) |
| Google API calls per sync | 1 Drive + N Sheets reads (ALL sheets) | 1 Drive + only changed sheets |
| DB writes per sync | Every row re-upserted | Only changed/new rows |
| Page load time | 3-8 seconds (may fail) | <500ms (always reads from DB cache) |
| Auto-sync frequency | On page visit if >2hrs old | Every 2 hours via cron (independent of visits) |
| Concurrent sync safety | Race conditions possible | Distributed lock prevents duplicates |

---

## Monitoring & Observability

After implementation, each sync run should log:
```json
{
  "sync_id": "run_2026-03-26T14:00:00Z",
  "type": "auto",
  "duration_ms": 4200,
  "sheets_checked": 15,
  "sheets_changed": 3,
  "sheets_skipped": 12,
  "rows_total": 45,
  "rows_updated": 8,
  "rows_new": 2,
  "rows_unchanged": 35,
  "errors": []
}
```

The `sync_runs` table provides a queryable history of every sync for debugging.

---

## Files to Create/Modify

### New Files
- `app/api/command-center/transitions/auto-sync/route.ts` — Cron-safe auto-sync with distributed lock

### Modified Files
- `lib/google-sheets.ts` — Auth token caching, retry logic, rate limiter, request timeouts
- `app/api/command-center/transitions/sync/route.ts` — Incremental sync, checksums, batch upserts, error isolation
- `app/api/command-center/transitions/sync-all/route.ts` — Use new incremental sync
- `app/command-center/transitions/page.tsx` — Remove auto-sync trigger from page load; page always reads from DB
- `scripts/migrate-transitions.ts` — Add row_checksum, sync_batch_id columns; sync_runs table
