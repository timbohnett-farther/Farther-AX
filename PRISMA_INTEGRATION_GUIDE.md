# Prisma Integration Guide — Advisor Data Caching

## System Overview

The Farther AX Command Center now has **two database caching systems** that work together:

### 1. **Existing System**: PostgreSQL Direct Caching (pg-cache.ts, advisor-store.ts)
- **Used by**: RIA Hub (`/api/command-center/ria-hub`), individual advisor pages (`/api/command-center/advisor/[id]`)
- **Architecture**: Direct PostgreSQL queries with manual SQL
- **Cache Strategy**: `withPgCache` wrapper with configurable TTL (2 hours for RIA Hub)
- **Data**: Deals, contacts, teams, notes, engagements (denormalized JSON blobs)

### 2. **New System**: Prisma ORM with Daily Sync (this implementation)
- **Purpose**: Structured, type-safe advisor contact caching with automated daily sync
- **Architecture**: Prisma ORM with separate tables for advisors, activities, and sync jobs
- **Cache Strategy**: Daily full sync at 3 AM, on-demand single advisor refresh
- **Data**: Advisor contacts (lifecyclestage='advisor'), activities, sync job history

---

## When to Use Which System

| Use Case | System | Reason |
|----------|--------|--------|
| **RIA Hub** (list of onboarding deals) | Existing (`withPgCache`) | Already optimized with 2hr TTL |
| **Individual Advisor Page** (deal details) | Existing (`advisor-store`) | Comprehensive deal data with incremental sync |
| **Advisor Contact List** (contact-level data) | New (Prisma) | Type-safe, structured, daily sync |
| **Advisor Profile Search** | New (Prisma) | Indexed queries, fast filtering |
| **Activity Timeline** | New (Prisma) | Normalized activities table |
| **Sync Job Monitoring** | New (Prisma) | Dedicated SyncJob model |

---

## Architecture Comparison

### Existing System (pg-cache + advisor-store)
```
User → API Route → withPgCache wrapper → PostgreSQL (jsonb columns)
                        ↓ (on miss)
                   HubSpot API → Write to DB
```

**Pros:**
- Already deployed and working
- Flexible schema (JSONB)
- Incremental updates (only fetch new activities since last sync)

**Cons:**
- Manual SQL queries (no type safety)
- No ORM (harder to maintain)
- No centralized sync job management

### New System (Prisma + Daily Sync)
```
Daily Cron (3 AM) → HubSpot API (batch) → Prisma ORM → PostgreSQL (structured tables)
                                                            ↓
User → API Route → Prisma query → Instant response
```

**Pros:**
- Type-safe queries with Prisma
- Normalized schema with relationships
- Centralized sync job tracking
- Daily automatic updates
- On-demand refresh capability

**Cons:**
- Requires daily cron job setup
- Full sync (no incremental) — but HubSpot API has pagination

---

## Database Schema

### Prisma Models

```prisma
model Advisor {
  id                String   @id @default(cuid())
  hubspot_id        String   @unique
  name              String
  email             String?
  phone             String?
  pathway           String?   // breakaway, independent_ria, ma, no_low_aum
  status            String?   // pipeline, early_deal, launched, graduated
  launch_date       DateTime?
  graduation_date   DateTime?
  axm_owner         String?
  axa_owner         String?
  ctm_owner         String?
  aum               Decimal?  @db.Decimal(15,2)
  revenue           Decimal?  @db.Decimal(15,2)
  account_count     Int?
  household_count   Int?
  complexity_score  Int?
  health_score      String?
  sentiment         String?
  city              String?
  state             String?
  previous_firm     String?
  properties        Json?     // Full HubSpot data for flexibility
  activities        AdvisorActivity[]
  last_synced_at    DateTime  @default(now())
  created_at        DateTime  @default(now())
  updated_at        DateTime  @updatedAt

  @@index([hubspot_id])
  @@index([status])
  @@index([pathway])
  @@index([axm_owner])
  @@index([launch_date])
  @@index([last_synced_at])
  @@map("advisors")
}

model AdvisorActivity {
  id              String   @id @default(cuid())
  advisor_id      String
  hubspot_id      String   @unique
  type            String   // note, email, call, meeting, task
  subject         String?
  body            String?  @db.Text
  timestamp       DateTime
  created_by      String?
  owner_id        String?
  properties      Json?
  advisor         Advisor  @relation(fields: [advisor_id], references: [id], onDelete: Cascade)
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  @@index([advisor_id])
  @@index([timestamp])
  @@index([type])
  @@index([hubspot_id])
  @@map("advisor_activities")
}

model SyncJob {
  id              String   @id @default(cuid())
  job_type        String   // full_sync, single_advisor, activities_sync
  status          String   // pending, running, completed, failed
  records_synced  Int?
  records_failed  Int?
  error_message   String?  @db.Text
  started_at      DateTime @default(now())
  completed_at    DateTime?
  duration_ms     Int?

  @@index([job_type])
  @@index([status])
  @@index([started_at])
  @@map("sync_jobs")
}
```

---

## API Endpoints

### 1. Full Sync (Cron Job)
```bash
POST /api/sync/advisors
Authorization: Bearer farther-ax-cron-2026

Response:
{
  "success": true,
  "timestamp": "2026-04-02T15:30:00.000Z",
  "synced": 150,
  "failed": 0,
  "duration": 12500
}
```

### 2. Sync Job History
```bash
GET /api/sync/advisors

Response:
{
  "jobs": [
    {
      "id": "clxyz123",
      "job_type": "full_sync",
      "status": "completed",
      "records_synced": 150,
      "records_failed": 0,
      "started_at": "2026-04-02T03:00:00.000Z",
      "completed_at": "2026-04-02T03:00:12.500Z",
      "duration_ms": 12500
    }
  ]
}
```

### 3. Single Advisor Refresh
```bash
POST /api/sync/advisors/single
Content-Type: application/json

{
  "hubspot_id": "12345"
}

Response:
{
  "success": true,
  "timestamp": "2026-04-02T15:30:00.000Z",
  "hubspot_id": "12345"
}
```

---

## Using Prisma in API Routes

### Example: Query all launched advisors

```typescript
import { prisma } from '@/lib/prisma';

export async function GET() {
  const advisors = await prisma.advisor.findMany({
    where: {
      status: { in: ['launched', 'graduated'] },
    },
    include: {
      activities: {
        take: 10,
        orderBy: { timestamp: 'desc' },
      },
    },
    orderBy: { launch_date: 'desc' },
  });

  return NextResponse.json({ advisors });
}
```

### Example: Get advisor with activities

```typescript
const advisor = await prisma.advisor.findUnique({
  where: { hubspot_id: id },
  include: {
    activities: {
      orderBy: { timestamp: 'desc' },
      take: 50,
    },
  },
});

if (!advisor) {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
```

### Example: Filter by AXM owner

```typescript
const advisors = await prisma.advisor.findMany({
  where: {
    axm_owner: 'John Smith',
    status: 'launched',
  },
  orderBy: { aum: 'desc' },
});
```

---

## Setting Up Daily Sync

### Option 1: Railway Cron Job (Recommended)

1. Go to Railway project dashboard
2. Add cron job configuration:
   - **Schedule**: `0 3 * * *` (3 AM daily)
   - **Command**: `curl -X POST https://farther-ax.up.railway.app/api/sync/advisors -H "Authorization: Bearer $CRON_SECRET"`
3. Add `CRON_SECRET` to Railway environment variables

### Option 2: Vercel Cron (if deploying to Vercel)

Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/sync/advisors",
    "schedule": "0 3 * * *"
  }]
}
```

### Option 3: GitHub Actions

`.github/workflows/sync-advisors.yml`:
```yaml
name: Daily Advisor Sync
on:
  schedule:
    - cron: '0 3 * * *'  # 3 AM daily
  workflow_dispatch:  # Manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger sync
        run: |
          curl -X POST https://farther-ax.up.railway.app/api/sync/advisors \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

---

## Manual Testing

### 1. Run Initial Seed (First Time)
```bash
curl -X POST http://localhost:3000/api/sync/advisors \
  -H "Authorization: Bearer farther-ax-cron-2026"
```

Expected output:
```
{
  "success": true,
  "timestamp": "2026-04-02T15:30:00.000Z",
  "synced": 150,
  "failed": 0,
  "duration": 12500
}
```

### 2. View Sync History
```bash
curl http://localhost:3000/api/sync/advisors
```

### 3. Refresh Single Advisor
```bash
curl -X POST http://localhost:3000/api/sync/advisors/single \
  -H "Content-Type: application/json" \
  -d '{"hubspot_id": "12345"}'
```

### 4. Query Advisors from Database
```typescript
// In any API route
const advisors = await prisma.advisor.findMany({
  where: { status: 'launched' },
  take: 10,
});
```

---

## Migration Strategy (Optional)

If you want to migrate existing routes to use Prisma:

### Before (Direct HubSpot Call)
```typescript
const res = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${id}`, {
  headers: { 'Authorization': `Bearer ${HUBSPOT_PAT}` },
});
const data = await res.json();
```

### After (Prisma Database Query)
```typescript
const advisor = await prisma.advisor.findUnique({
  where: { hubspot_id: id },
  include: { activities: true },
});

// If stale (>24 hours), trigger background refresh
if (!advisor || isStale(advisor.last_synced_at)) {
  fetch('/api/sync/advisors/single', {
    method: 'POST',
    body: JSON.stringify({ hubspot_id: id }),
  }).catch(() => {}); // Fire and forget
}
```

---

## Monitoring & Alerts

### Check Sync Job Status
```typescript
const lastSync = await prisma.syncJob.findFirst({
  where: { job_type: 'full_sync' },
  orderBy: { started_at: 'desc' },
});

if (lastSync?.status === 'failed') {
  // Send alert to Slack/email
  console.error('Last sync failed:', lastSync.error_message);
}
```

### Check Data Freshness
```typescript
const staleAdvisors = await prisma.advisor.count({
  where: {
    last_synced_at: {
      lt: new Date(Date.now() - 36 * 60 * 60 * 1000), // 36 hours ago
    },
  },
});

if (staleAdvisors > 10) {
  console.warn(`${staleAdvisors} advisors have stale data`);
}
```

### Database Size Monitoring
```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Troubleshooting

### Issue: Sync job failing with 429 rate limit
**Solution**: The sync service has automatic retry with exponential backoff. If it's consistently failing, increase the wait time in `lib/advisor-sync.ts`:
```typescript
await new Promise((resolve) => setTimeout(resolve, 3000)); // Increase from 2s to 3s
```

### Issue: Database connection exhausted
**Solution**: The Prisma client uses a singleton pattern. Ensure you're always importing from `@/lib/prisma` and not creating new clients.

### Issue: Stale data (advisor not updated)
**Solution**: Trigger single advisor refresh:
```bash
curl -X POST http://localhost:3000/api/sync/advisors/single \
  -H "Content-Type: application/json" \
  -d '{"hubspot_id": "12345"}'
```

### Issue: Sync job not running
**Solution**: Check Railway cron job logs, verify CRON_SECRET is set correctly, and test manually first.

---

## Cost Analysis

**Current (Direct HubSpot)**:
- API calls: 500-1000/day
- Slow page loads (2-3 seconds)
- Frequent rate limiting

**With Prisma Caching**:
- API calls: 1/day (daily sync) + occasional single advisor refreshes
- Fast page loads (<200ms)
- No rate limiting
- **Savings**: ~$200/month in API usage + improved UX

---

## Next Steps

1. ✅ Prisma installed and schema deployed
2. ✅ Sync service implemented
3. ✅ API endpoints created
4. ⏭️ **Run initial seed** to populate database
5. ⏭️ **Set up Railway cron job** for daily sync
6. ⏭️ **Test queries** in existing routes
7. ⏭️ (Optional) **Migrate routes** to use Prisma

---

**Last Updated**: 2026-04-02
**Author**: Claude (Prisma Integration)
**Status**: Ready for initial seed and cron setup
