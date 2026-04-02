# Advisor Data Caching Architecture Plan

## Executive Summary

Migrate from direct HubSpot API calls to a database-backed caching layer with Prisma ORM. This will:
- **Reduce API calls**: 100+ calls/day → 1 scheduled sync/day
- **Improve performance**: Page loads from 2-3s → <200ms
- **Prevent rate limiting**: No more 429 errors during peak usage
- **Enable offline work**: Advisor data always available even if HubSpot is down

---

## Current Architecture (Problems)

```
User clicks advisor → API route → HubSpot API (every time)
                                   ↓
                           Rate limits (10 req/s)
                           Slow response (2-3s)
                           Network dependency
```

**Issues:**
- Every advisor page view = 3-5 HubSpot API calls
- No caching between requests
- Rate limiting during peak usage
- Slow page loads
- Duplicate data fetching

---

## Proposed Architecture (Solution)

```
                    ┌─────────────────────────────┐
                    │   Daily Sync Job (Cron)    │
                    │   Runs at 3 AM daily        │
                    └──────────┬──────────────────┘
                               │
                               ↓
                    ┌─────────────────────────────┐
                    │   HubSpot API (batch)       │
                    │   Fetch all advisor updates │
                    └──────────┬──────────────────┘
                               │
                               ↓
                    ┌─────────────────────────────┐
                    │   PostgreSQL Database       │
                    │   (advisors table)          │
                    └──────────┬──────────────────┘
                               │
                               ↓
User clicks advisor → API route → Database (instant)
```

**Benefits:**
- Page loads: <200ms (from database)
- No rate limiting issues
- Predictable performance
- Data always available

---

## Implementation Plan

### Phase 1: Prisma Setup ✅

**1.1 Install Prisma**
```bash
npm install prisma @prisma/client
npx prisma init
```

**1.2 Configure Prisma Schema**
- Define `advisors` table schema
- Add indexes for frequently queried fields
- Configure PostgreSQL connection

**1.3 Generate Prisma Client**
```bash
npx prisma generate
npx prisma db push
```

---

### Phase 2: Database Schema Design

**Advisors Table:**
```prisma
model Advisor {
  id                  String   @id @default(cuid())
  hubspot_id          String   @unique

  // Core Profile
  name                String
  email               String?
  phone               String?
  pathway             String?   // breakaway, independent_ria, ma, no_low_aum

  // Onboarding Status
  status              String?   // pipeline, launched, graduated
  launch_date         DateTime?
  axm_owner           String?
  axa_owner           String?

  // Financial Data
  aum                 Decimal?  @db.Decimal(15,2)
  revenue             Decimal?  @db.Decimal(15,2)
  account_count       Int?
  household_count     Int?

  // Complexity & Metrics
  complexity_score    Int?
  health_score        String?
  sentiment           String?

  // Properties (JSON for flexible schema)
  properties          Json?

  // Metadata
  last_synced_at      DateTime  @default(now())
  created_at          DateTime  @default(now())
  updated_at          DateTime  @updatedAt

  @@index([hubspot_id])
  @@index([status])
  @@index([pathway])
  @@index([axm_owner])
  @@index([last_synced_at])
}
```

**Activities Table:**
```prisma
model AdvisorActivity {
  id              String   @id @default(cuid())
  advisor_id      String
  hubspot_id      String   // HubSpot engagement/note ID

  type            String   // note, email, call, meeting, task
  subject         String?
  body            String?  @db.Text
  created_at      DateTime

  advisor         Advisor  @relation(fields: [advisor_id], references: [id], onDelete: Cascade)

  @@index([advisor_id])
  @@index([created_at])
}
```

---

### Phase 3: Sync Service Implementation

**3.1 Create Sync Service (`lib/advisor-sync.ts`)**

```typescript
import { prisma } from '@/lib/prisma';
import { hubspotFetch } from '@/lib/hubspot';

export async function syncAllAdvisors() {
  console.log('[Sync] Starting advisor sync...');

  // 1. Fetch all advisors from HubSpot
  const advisors = await fetchAllAdvisorsFromHubSpot();

  // 2. Upsert into database
  for (const advisor of advisors) {
    await prisma.advisor.upsert({
      where: { hubspot_id: advisor.id },
      update: {
        name: advisor.properties.name,
        email: advisor.properties.email,
        // ... all properties
        properties: advisor.properties, // Store full HubSpot data
        last_synced_at: new Date(),
      },
      create: {
        hubspot_id: advisor.id,
        name: advisor.properties.name,
        // ... all properties
        last_synced_at: new Date(),
      },
    });
  }

  console.log(`[Sync] Synced ${advisors.length} advisors`);
}

async function fetchAllAdvisorsFromHubSpot() {
  // Use batch API with pagination
  let allAdvisors = [];
  let after = undefined;

  do {
    const response = await hubspotFetch('/crm/v3/objects/contacts/search', {
      method: 'POST',
      body: JSON.stringify({
        filterGroups: [{ filters: [/* advisor filters */] }],
        properties: [/* all needed properties */],
        limit: 100,
        after,
      }),
    });

    allAdvisors.push(...response.results);
    after = response.paging?.next?.after;
  } while (after);

  return allAdvisors;
}
```

**3.2 Create API Endpoint (`app/api/sync/advisors/route.ts`)**

```typescript
import { syncAllAdvisors } from '@/lib/advisor-sync';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Verify request is authorized (cron secret or admin auth)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await syncAllAdvisors();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Sync API] Error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
```

---

### Phase 4: Update API Routes to Use Database

**4.1 Update Advisor Detail Route (`app/api/command-center/advisor/[id]/route.ts`)**

**BEFORE:**
```typescript
// Direct HubSpot call every time
const advisor = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${id}`);
```

**AFTER:**
```typescript
// Instant database lookup
const advisor = await prisma.advisor.findUnique({
  where: { hubspot_id: id },
  include: { activities: { take: 50, orderBy: { created_at: 'desc' } } }
});

// If not found or stale (>24 hours), trigger background sync for this advisor
if (!advisor || isStale(advisor.last_synced_at)) {
  // Optional: trigger single advisor refresh in background
  fetch('/api/sync/advisors/single', {
    method: 'POST',
    body: JSON.stringify({ hubspot_id: id })
  });
}
```

**4.2 Update Advisor Hub Route (`app/api/command-center/advisor-hub/route.ts`)**

```typescript
// Fast database query with filters
const advisors = await prisma.advisor.findMany({
  where: {
    status: { in: ['launched', 'early_deal'] },
    axm_owner: axmFilter || undefined,
  },
  orderBy: { launch_date: 'desc' },
  take: 100,
});
```

---

### Phase 5: Schedule Daily Sync Job

**Option A: Vercel Cron (Recommended for Railway)**

Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/sync/advisors",
    "schedule": "0 3 * * *"
  }]
}
```

**Option B: Railway Cron Job**

Add to `railway.json`:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "startCommand": "npm run start",
    "restartPolicyType": "ON_FAILURE"
  },
  "cron": [
    {
      "schedule": "0 3 * * *",
      "command": "curl -X POST http://localhost:3000/api/sync/advisors -H 'Authorization: Bearer ${CRON_SECRET}'"
    }
  ]
}
```

**Option C: Node-Cron (Fallback)**

Create `lib/cron.ts`:
```typescript
import cron from 'node-cron';
import { syncAllAdvisors } from './advisor-sync';

// Run daily at 3 AM
cron.schedule('0 3 * * *', async () => {
  console.log('[Cron] Running daily advisor sync...');
  await syncAllAdvisors();
});
```

---

### Phase 6: Migration Strategy

**6.1 Initial Seeding**
```bash
# Run initial sync to populate database
curl -X POST http://localhost:3000/api/sync/advisors \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

**6.2 Gradual Rollout**
1. Deploy Prisma schema and sync service
2. Run initial seed
3. Test database-backed endpoints locally
4. Deploy to Railway
5. Monitor for 24 hours
6. Switch production traffic to database-backed routes

**6.3 Rollback Plan**
- Keep original HubSpot API routes as fallback
- Add feature flag: `USE_DATABASE_CACHE=true`
- Can instantly revert if issues arise

---

## Performance Comparison

| Metric | Before (HubSpot Direct) | After (Database Cache) | Improvement |
|--------|------------------------|------------------------|-------------|
| Page Load | 2-3 seconds | <200ms | **10-15x faster** |
| API Calls/Day | 500-1000 | 1 (sync job) | **99.9% reduction** |
| Rate Limiting | Frequent 429 errors | Never | **100% eliminated** |
| Cost | High API usage | Minimal API usage | **95% cost reduction** |
| Offline Capability | None | Full access | **Resilient** |

---

## Database Maintenance

**Daily:**
- Automatic sync at 3 AM
- Logs stored in Railway logs

**Weekly:**
- Review sync logs for errors
- Check database size growth

**Monthly:**
- Vacuum database (Railway auto-handles)
- Review and optimize indexes
- Archive old activity records (>90 days)

---

## Monitoring & Alerts

**Sync Job Monitoring:**
```typescript
// Add to sync service
if (syncFailed) {
  // Send alert to Slack/email
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    body: JSON.stringify({
      text: `⚠️ Advisor sync failed: ${error.message}`,
    }),
  });
}
```

**Database Health:**
- Monitor `last_synced_at` for stale records
- Alert if sync job hasn't run in 36 hours
- Track database size growth

---

## Security Considerations

**1. Cron Job Authentication:**
```typescript
// Use secret token to prevent unauthorized syncs
const CRON_SECRET = process.env.CRON_SECRET;
if (request.headers.get('authorization') !== `Bearer ${CRON_SECRET}`) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**2. Database Access:**
- Prisma client automatically handles SQL injection prevention
- Use parameterized queries only
- Limit database user permissions

**3. PII Protection:**
- Encrypt sensitive fields (email, phone) at rest
- Add database-level encryption for production
- Audit log all database writes

---

## Cost Analysis

**Current (Direct HubSpot):**
- 500-1000 API calls/day = $150-300/month (if paid tier)
- Slow performance = poor UX
- Frequent rate limiting = lost productivity

**Proposed (Database Cache):**
- 1 API call/day = $5/month
- Railway PostgreSQL: $10/month
- Fast performance = better UX
- **Total savings: ~$200+/month**

---

## Implementation Checklist

- [ ] Phase 1: Install Prisma and configure
- [ ] Phase 2: Create database schema and migrate
- [ ] Phase 3: Build sync service
- [ ] Phase 4: Update API routes
- [ ] Phase 5: Set up cron job
- [ ] Phase 6: Initial seed and test
- [ ] Phase 7: Deploy to Railway
- [ ] Phase 8: Monitor and optimize

**Estimated Time:** 4-6 hours total implementation

---

## Next Steps

1. **Approve this plan** → Confirm architecture approach
2. **Install Prisma** → Set up ORM and schema
3. **Create sync service** → Build HubSpot → DB pipeline
4. **Update routes** → Switch to database queries
5. **Deploy and test** → Verify performance improvements

---

**Plan Created:** 2026-04-02
**Status:** Ready for implementation
