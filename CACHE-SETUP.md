# Cache-First Architecture — Setup Guide

This document covers everything needed to activate the Redis + S3 Bucket cache layer on Railway.

---

## 1. Provision Railway Redis

1. Open your Railway project dashboard
2. Click **Create → Database → Redis Stack**
3. Railway provisions a Redis instance automatically
4. No configuration needed — defaults are fine for this use case

**What you get:** A `REDIS_URL` variable reference (e.g., `redis://default:password@host:port`)

### Wire the Variable

In your **Next.js service** (the main app) on Railway:

1. Go to **Variables**
2. Add a new variable:

```
REDIS_URL = ${{Redis.REDIS_URL}}
```

This uses Railway's variable reference syntax to automatically inject the connection string.

---

## 2. Provision Railway Storage Bucket

1. Open your Railway project dashboard
2. Click **Create → Bucket**
3. Select the region closest to your service (us-west or us-east)
4. Name it `advisor-data-cache`

**What you get:** Five auto-generated variables:

| Variable | Description |
|----------|-------------|
| `BUCKET` | Bucket name (e.g., `advisor-data-cache-abc123`) |
| `ACCESS_KEY_ID` | S3-compatible access key |
| `SECRET_ACCESS_KEY` | S3-compatible secret key |
| `ENDPOINT` | S3 endpoint URL (e.g., `https://storage.railway.app`) |
| `REGION` | Bucket region (usually `auto`) |

### Wire the Variables

In your **Next.js service** on Railway, go to **Variables** and add:

```
S3_BUCKET     = ${{advisor-data-cache.BUCKET}}
S3_ACCESS_KEY = ${{advisor-data-cache.ACCESS_KEY_ID}}
S3_SECRET_KEY = ${{advisor-data-cache.SECRET_ACCESS_KEY}}
S3_ENDPOINT   = ${{advisor-data-cache.ENDPOINT}}
S3_REGION     = ${{advisor-data-cache.REGION}}
```

Replace `advisor-data-cache` with whatever you named your bucket if different.

---

## 3. Environment Variables — Complete Reference

### New Variables (add these)

| Variable | Where to Set | Value | Required? |
|----------|-------------|-------|-----------|
| `REDIS_URL` | Next.js service | `${{Redis.REDIS_URL}}` | Yes |
| `S3_BUCKET` | Next.js service | `${{advisor-data-cache.BUCKET}}` | Yes |
| `S3_ACCESS_KEY` | Next.js service | `${{advisor-data-cache.ACCESS_KEY_ID}}` | Yes |
| `S3_SECRET_KEY` | Next.js service | `${{advisor-data-cache.SECRET_ACCESS_KEY}}` | Yes |
| `S3_ENDPOINT` | Next.js service | `${{advisor-data-cache.ENDPOINT}}` | Yes |
| `S3_REGION` | Next.js service | `${{advisor-data-cache.REGION}}` | Yes |
| `HUBSPOT_CLIENT_SECRET` | Next.js service | From HubSpot Developer Portal (your app's client secret) | Optional (for webhook signature verification) |

### Existing Variables (DO NOT change these)

| Variable | Purpose |
|----------|---------|
| `HUBSPOT_ACCESS_TOKEN` or `HUBSPOT_PAT` | HubSpot API authentication |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Google Sheets API authentication |
| `GOOGLE_DRIVE_FOLDER_ID` | Transition sheets Drive folder |
| `DOCUSIGN_INTEGRATION_KEY` | DocuSign OAuth |
| `DOCUSIGN_SECRET_KEY` | DocuSign OAuth |
| `DOCUSIGN_API_ACCOUNT_ID` | DocuSign API |
| `DATABASE_URL` | PostgreSQL connection |
| `NEXTAUTH_SECRET` | NextAuth session encryption |
| `NEXTAUTH_URL` | NextAuth callback URL |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth login |

These remain exactly as they are. The cache layer wraps around them — it does not replace or modify them.

---

## 4. Deploy the Background Sync Worker

The sync worker runs on a cron schedule to keep caches fresh. Deploy it as a **separate Railway service** in the same project.

### Option A: Separate Railway Service (Recommended)

1. In your Railway project, click **Create → Service → GitHub Repo**
2. Select the same `Farther-AX` repo
3. Go to the new service's **Settings**:
   - **Start Command:** `npx tsx worker/sync.ts`
   - **Cron Schedule:** `*/5 * * * *` (every 5 minutes)
4. Go to **Variables** and add the same environment variables the main app uses:

```
REDIS_URL              = ${{Redis.REDIS_URL}}
S3_BUCKET              = ${{advisor-data-cache.BUCKET}}
S3_ACCESS_KEY          = ${{advisor-data-cache.ACCESS_KEY_ID}}
S3_SECRET_KEY          = ${{advisor-data-cache.SECRET_ACCESS_KEY}}
S3_ENDPOINT            = ${{advisor-data-cache.ENDPOINT}}
S3_REGION              = ${{advisor-data-cache.REGION}}
DATABASE_URL           = ${{Postgres.DATABASE_URL}}
HUBSPOT_ACCESS_TOKEN   = (same value as main service)
RAILWAY_PUBLIC_DOMAIN  = (your main service's public domain, e.g., farther-ax.up.railway.app)
```

The worker spins up every 5 minutes, syncs changed data, then shuts down. Railway only charges for active compute time.

### Option B: Add to railway.toml (Alternative)

If you prefer a single service, create `railway.toml` in the repo root:

```toml
[deploy]
startCommand = "npx tsx worker/sync.ts"
cronSchedule = "*/5 * * * *"
```

Note: This approach runs the worker instead of the web server. Option A (separate service) is recommended so both run independently.

---

## 5. Configure HubSpot Webhooks (Optional but Recommended)

Webhooks give you near-real-time cache updates (within seconds of a HubSpot change) instead of waiting for the 5-minute cron.

### Steps

1. Go to [HubSpot Developer Portal](https://app.hubspot.com/developer) → your app
2. Navigate to **Webhooks** (or **Event Subscriptions**)
3. Subscribe to these event types:
   - `deal.propertyChange`
   - `deal.creation`
   - `deal.deletion`
4. Set the **Target URL** to:
   ```
   https://your-railway-domain.up.railway.app/api/webhooks/hubspot
   ```
   Replace with your actual Railway public domain.
5. Copy your app's **Client Secret** from the app settings page
6. Add it as the `HUBSPOT_CLIENT_SECRET` environment variable in Railway

### What Happens

When an advisor deal changes in HubSpot:
1. HubSpot sends a POST to `/api/webhooks/hubspot` within seconds
2. The webhook handler verifies the signature using `HUBSPOT_CLIENT_SECRET`
3. It invalidates the old cached data for that advisor
4. It re-fetches the advisor using the existing API logic
5. It writes the fresh data to Redis + S3 Bucket
6. It invalidates the pipeline and metrics aggregate caches

If `HUBSPOT_CLIENT_SECRET` is not set, signature verification is skipped (the webhook still works, but without authentication — fine for initial testing).

---

## 6. Initial Cache Warm-Up

After provisioning Redis and S3 Bucket, run this once to pre-populate all advisor data:

```bash
npx tsx scripts/warm-cache.ts
```

This script:
1. Fetches all active pipeline deal IDs from HubSpot
2. Calls the existing advisor detail API for each deal (batches of 5, with rate limiting)
3. Writes each result to both Redis and S3 Bucket
4. Also warms the pipeline and metrics caches

After warm-up, every advisor page loads instantly from Redis on the first visit.

**Run this from a machine that can reach both your Railway app and HubSpot.** If running locally, make sure `NEXTAUTH_URL` or `RAILWAY_PUBLIC_DOMAIN` points to your deployed app URL.

---

## 7. Post-Deployment Verification

### Health Check

Hit this endpoint to verify all cache layers are operational:

```
GET https://your-domain.up.railway.app/api/health/cache
```

Expected response when everything is healthy:
```json
{
  "status": "healthy",
  "layers": {
    "redis": "healthy",
    "bucket": "healthy",
    "postgres": "healthy"
  },
  "sync": {
    "lastRun": "2026-03-29T12:00:00.000Z",
    "lastAdvisorSync": "2026-03-29T12:00:00.000Z"
  },
  "cache": {
    "pgTotal": "15",
    "pgFresh": "12",
    "pgStale": "3",
    "advisorProfiles": "42"
  }
}
```

If Redis or S3 shows `"unavailable"` instead of `"unhealthy"`, it means the environment variables are not set — the system is still functional (falls through to PostgreSQL/HubSpot) but not getting the speed benefits.

### Data Integrity Check

Run this to confirm cached data matches live data exactly:

```bash
npx tsx scripts/verify-integrity.ts
```

This compares 5 sample advisors across Redis, S3, and live HubSpot data. All fields must match (ignoring the `_cachedAt` metadata timestamp).

### Verify Cache Headers

Load any advisor page and check the response headers in your browser's Network tab:

| Header | Value | Meaning |
|--------|-------|---------|
| `X-Cache: REDIS` | Data served from Redis | Fastest path (~15ms) |
| `X-Cache: BUCKET` | Data served from S3 | Redis miss, bucket hit (~50ms) |
| `X-Cache: ORIGIN` | Data served from PostgreSQL/HubSpot | Cold cache, first load (~500ms+) |
| `X-Cache: FALLBACK` | Stale DB data after all else failed | Error recovery |

After warm-up, you should see `REDIS` on most requests.

---

## 8. Graceful Degradation

The system is designed to work at every level of provisioning:

| Redis | S3 Bucket | Behavior |
|-------|-----------|----------|
| Not provisioned | Not provisioned | Existing behavior — PostgreSQL + HubSpot (no speed improvement, no breakage) |
| Provisioned | Not provisioned | Redis caching only — fast reads, but no durable warm cache |
| Not provisioned | Provisioned | S3 caching only — slower than Redis but survives restarts |
| Provisioned | Provisioned | Full speed — Redis for hot reads, S3 for durability |

You can provision Redis first and add S3 later, or vice versa. The code checks for environment variables at runtime and skips any unavailable layer.

---

## 9. Cost Estimates

| Resource | Monthly Cost | Notes |
|----------|-------------|-------|
| Railway Redis (Starter) | ~$5-10/mo | 256MB RAM is plenty for advisor JSON blobs |
| Railway Storage Bucket | ~$0.01/mo | $0.015/GB, free API ops and egress. 100 advisors at 5KB each = 500KB |
| Sync Worker | ~$1-3/mo | Runs 288 times/day (every 5 min), each run takes ~30 seconds |
| **Total** | **~$6-13/mo** | For ~25x faster page loads and eliminated rate-limit risk |

---

## 10. Rollback Plan

If any issues arise, the system can be rolled back without code changes:

1. **Remove Redis/S3 env vars** from the Railway service
2. **Disable the sync worker** service
3. All API routes automatically fall through to the existing PostgreSQL/HubSpot logic
4. No data loss — HubSpot and Google Sheets remain the source of truth

The cache layer is purely additive. Removing it restores the previous behavior exactly.

---

## Quick Start Checklist

- [ ] Create Railway Redis instance
- [ ] Add `REDIS_URL` variable to main service
- [ ] Create Railway Storage Bucket (`advisor-data-cache`)
- [ ] Add `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_ENDPOINT`, `S3_REGION` to main service
- [ ] Deploy main service (auto-deploys from main branch)
- [ ] Hit `/api/health/cache` — confirm Redis and Bucket show `healthy`
- [ ] Run `npx tsx scripts/warm-cache.ts` to pre-populate caches
- [ ] Create sync worker service with cron schedule `*/5 * * * *`
- [ ] (Optional) Configure HubSpot webhooks + add `HUBSPOT_CLIENT_SECRET`
- [ ] Run `npx tsx scripts/verify-integrity.ts` to confirm data integrity
- [ ] Verify `X-Cache: REDIS` header on advisor page loads
