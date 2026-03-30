# HubSpot API Migration Guide

## Overview

This guide shows how to migrate existing HubSpot API calls to use the centralized `lib/hubspot.ts` library.

**Benefits:**
- ✅ Automatic retry on 429/502/503 errors (exponential backoff)
- ✅ Consistent error handling across all routes
- ✅ Reduced code duplication (10x less boilerplate)
- ✅ Type-safe responses with TypeScript interfaces
- ✅ Better maintainability (update logic in one place)

---

## Before & After Examples

### Example 1: Simple Object Fetch

**❌ Before (manual fetch):**
```typescript
const res = await fetch(
  `https://api.hubapi.com/crm/v3/objects/deals/${id}?properties=dealname,aum`,
  { headers: { 'Authorization': `Bearer ${HUBSPOT_PAT}` } }
);
if (!res.ok) throw new Error(`Deal fetch failed: ${res.status}`);
const deal = await res.json();
```

**✅ After (using hubspot.ts):**
```typescript
import { fetchWithAssociations } from '@/lib/hubspot';

const deal = await fetchWithAssociations('deals', id, 'dealname,aum');
```

**Code reduction:** 5 lines → 1 line

---

### Example 2: Paginated Search

**❌ Before (manual pagination):**
```typescript
const deals: any[] = [];
let after: string | undefined;

do {
  const body = {
    filterGroups: [{ filters: [{ propertyName: 'pipeline', operator: 'EQ', value: '751770' }] }],
    properties: ['dealname', 'aum'],
    limit: 100,
  };
  if (after) body.after = after;

  const res = await fetch('https://api.hubapi.com/crm/v3/objects/deals/search', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${HUBSPOT_PAT}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  const data = await res.json();
  deals.push(...data.results);
  after = data.paging?.next?.after;
} while (after);
```

**✅ After (using hubspot.ts):**
```typescript
import { paginatedSearch } from '@/lib/hubspot';

const deals = await paginatedSearch(
  'deals',
  [{ filters: [{ propertyName: 'pipeline', operator: 'EQ', value: '751770' }] }],
  ['dealname', 'aum']
);
```

**Code reduction:** 23 lines → 5 lines

---

### Example 3: Fetch with Associations

**❌ Before (manual association fetch):**
```typescript
// Fetch deal
const dealRes = await fetch(
  `https://api.hubapi.com/crm/v3/objects/deals/${id}?properties=dealname&associations=contacts`,
  { headers: { 'Authorization': `Bearer ${HUBSPOT_PAT}` } }
);
if (!dealRes.ok) throw new Error(`Deal fetch failed`);
const deal = await dealRes.json();

// Fetch associated contacts
const assocRes = await fetch(
  `https://api.hubapi.com/crm/v4/objects/deals/${id}/associations/contacts`,
  { headers: { 'Authorization': `Bearer ${HUBSPOT_PAT}` } }
);
if (!assocRes.ok) return [];
const assocData = await assocRes.json();
const contactIds = assocData.results.map((r: any) => r.toObjectId);
```

**✅ After (using hubspot.ts):**
```typescript
import { fetchWithAssociations, fetchAssociations } from '@/lib/hubspot';

// Fetch deal with associations metadata
const deal = await fetchWithAssociations('deals', id, 'dealname', 'contacts');

// Fetch full association details
const contacts = await fetchAssociations('deals', id, 'contacts');
```

**Code reduction:** 16 lines → 4 lines

---

### Example 4: Batch Read Contacts

**❌ Before (manual batch read):**
```typescript
const batchUrl = 'https://api.hubapi.com/crm/v3/objects/contacts/batch/read';
const res = await fetch(batchUrl, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${HUBSPOT_PAT}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    inputs: contactIds.map(id => ({ id })),
    properties: ['firstname', 'lastname', 'email'],
  }),
});

if (!res.ok) {
  console.error(`Batch fetch failed: ${res.status}`);
  return [];
}

const data = await res.json();
const contacts = data.results ?? [];
```

**✅ After (using hubspot.ts):**
```typescript
import { batchRead } from '@/lib/hubspot';

const contacts = await batchRead('contacts', contactIds, ['firstname', 'lastname', 'email']);
```

**Code reduction:** 18 lines → 1 line

---

### Example 5: Batch Upsert (Complex)

**❌ Before (manual batch with retry):**
```typescript
const stats = { success: 0, failed: 0, total: inputs.length };

for (let i = 0; i < inputs.length; i += 100) {
  const batch = inputs.slice(i, i + 100);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/batch/upsert`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HUBSPOT_PAT}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: batch }),
      });

      if (!res.ok) {
        if (res.status === 429) {
          await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, attempt)));
          continue;
        }
        throw new Error(`Upsert failed: ${res.status}`);
      }

      stats.success += batch.length;
      break;
    } catch (error) {
      if (attempt === 2) {
        stats.failed += batch.length;
      }
    }
  }
}
```

**✅ After (using hubspot.ts):**
```typescript
import { batchUpsert } from '@/lib/hubspot';

const stats = await batchUpsert('contacts', inputs);
console.log(`✓ Upserted ${stats.success}/${stats.total} contacts`);
```

**Code reduction:** 30+ lines → 3 lines

---

## Migration Checklist

When migrating a route:

1. **Remove manual fetch calls** - Replace with `hubspotFetch()` or specialized helpers
2. **Remove pagination loops** - Use `paginatedSearch()` for search endpoints
3. **Remove retry logic** - Automatic in `hubspotFetch()`
4. **Remove batch chunking** - Automatic in `batchUpsert()` and `batchRead()`
5. **Import from lib/hubspot** - Add `import { ... } from '@/lib/hubspot';`
6. **Test the route** - Verify functionality with `npm run dev`
7. **Update error handling** - Leverage consistent error messages

---

## Function Reference

| Function | Use Case | Key Features |
|----------|----------|--------------|
| `hubspotFetch()` | General API calls | Retry on 429/502/503, exponential backoff |
| `paginatedSearch()` | Search with filters | Auto-pagination, handles 'after' cursor |
| `batchUpsert()` | Bulk create/update | Auto-chunking (100/batch), progress logging |
| `batchRead()` | Fetch multiple objects | Efficient bulk reads |
| `fetchWithAssociations()` | Object + associations | Single call for object + metadata |
| `fetchAssociations()` | Get related objects | Fetch associations by type |

---

## Rollout Plan

**Phase 1: High-Traffic Routes** (Priority)
- [ ] `/api/command-center/pipeline/route.ts`
- [ ] `/api/command-center/advisor/[id]/route.ts`
- [ ] `/api/command-center/metrics/route.ts`

**Phase 2: Medium-Traffic Routes**
- [ ] `/api/command-center/transitions/team-mappings/route.ts`
- [ ] `/api/command-center/ria-hub/route.ts`
- [ ] `/api/command-center/alerts/route.ts`

**Phase 3: Low-Traffic Routes**
- [ ] All remaining routes (28 routes)

**Estimated Time:**
- ~5 minutes per simple route (object fetch, associations)
- ~10 minutes per complex route (pagination, batch operations)
- Total: ~4-6 hours for all 31 routes

---

## Testing Strategy

After migrating each route:

1. **Local dev test**: `npm run dev` and manually test the page
2. **Check console**: Verify no new errors
3. **Compare results**: Ensure data matches pre-migration
4. **Monitor logs**: Check for retry warnings (429 handling)
5. **Build check**: `npm run build` — ensure TypeScript compiles

---

## Common Patterns

### Pattern: Search + Batch Read
```typescript
// Step 1: Search for deal IDs
const deals = await paginatedSearch('deals', filterGroups, ['hs_object_id']);
const dealIds = deals.map(d => d.id);

// Step 2: Batch read full details
const fullDeals = await batchRead('deals', dealIds, DEAL_PROPERTIES);
```

### Pattern: Fetch Object + Multiple Association Types
```typescript
const deal = await fetchWithAssociations('deals', id, DEAL_PROPS, 'contacts,notes');
const contacts = await fetchAssociations('deals', id, 'contacts');
const notes = await fetchAssociations('deals', id, 'notes');
```

### Pattern: Custom Object with Associations
```typescript
const TEAMS_OBJECT_TYPE = '2-43222882';
const teams = await paginatedSearch(TEAMS_OBJECT_TYPE, filters, properties);
const teamAssocs = await fetchAssociations('deals', dealId, TEAMS_OBJECT_TYPE);
```

---

## Error Handling Best Practices

**✅ DO:**
```typescript
try {
  const deals = await paginatedSearch('deals', filters, properties);
  return NextResponse.json({ deals });
} catch (error) {
  console.error('Pipeline fetch failed:', error);
  return NextResponse.json(
    { error: 'Failed to load pipeline data' },
    { status: 500 }
  );
}
```

**❌ DON'T:**
```typescript
// Silent failure
const deals = await paginatedSearch('deals', filters, properties).catch(() => []);

// Overly generic error
catch (e) { return NextResponse.json({ error: 'Error' }) }
```

---

## Performance Notes

- **Pagination**: `paginatedSearch()` fetches ALL pages — use filters to limit results
- **Batch operations**: Auto-chunked to 100 items/batch (HubSpot limit)
- **Retry backoff**: 1s → 2s → 4s (exponential)
- **Rate limiting**: Automatically handled (10 req/s limit respected)

---

## Questions?

- **"Will this break existing functionality?"** — No, it's a drop-in replacement with the same behavior + better reliability
- **"Do I need to update all routes at once?"** — No, migrate incrementally (routes work independently)
- **"What if I need custom retry logic?"** — Use `hubspotFetch()` directly with your own wrapper
- **"Can I still use manual fetch for special cases?"** — Yes, but `hubspotFetch()` handles 95% of use cases

---

**Next Step:** See example migration in PR #XXX or start with `/api/command-center/pipeline/route.ts`
