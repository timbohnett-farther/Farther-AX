import { NextResponse } from 'next/server';
import pool from '@/lib/db';

const HUBSPOT_PAT = process.env.HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_PAT || '';
const CUSTOM_OBJECT_TYPE = '2-13676628';
const SYNC_COOLDOWN_MS = 20 * 60 * 60 * 1000; // 20 hours

const PROPERTIES = [
  'advisor_name',
  'current_value',
  'bd_market_value',
  'fee_rate_bps',
  'monthly_fee_amount',
];

async function shouldSkipSync(): Promise<boolean> {
  try {
    const result = await pool.query<{ expires_at: Date }>(
      `SELECT expires_at FROM api_cache WHERE cache_key = 'managed-accounts-last-sync'`
    );
    if (result.rows[0] && result.rows[0].expires_at > new Date()) {
      return true;
    }
  } catch {
    // If DB fails, allow sync to proceed
  }
  return false;
}

async function markSyncRun(): Promise<void> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SYNC_COOLDOWN_MS);
  await pool.query(
    `INSERT INTO api_cache (cache_key, data, expires_at, created_at, updated_at)
     VALUES ('managed-accounts-last-sync', '"ok"', $1, $2, $2)
     ON CONFLICT (cache_key) DO UPDATE
       SET data = EXCLUDED.data,
           expires_at = EXCLUDED.expires_at,
           updated_at = EXCLUDED.updated_at`,
    [expiresAt, now]
  );
}

async function fetchAllManagedAccounts() {
  const records: Record<string, string | null>[] = [];
  let after: string | undefined;

  do {
    const body: Record<string, unknown> = {
      properties: PROPERTIES,
      limit: 100,
    };
    if (after) body.after = after;

    const res = await fetch(
      `https://api.hubapi.com/crm/v3/objects/${CUSTOM_OBJECT_TYPE}/search`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HUBSPOT_PAT}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`HubSpot ${res.status}: ${errBody}`);
    }

    const data = await res.json();
    for (const r of data.results ?? []) {
      records.push({ hubspot_object_id: r.id, ...r.properties });
    }
    after = data.paging?.next?.after;
  } while (after);

  return records;
}

export async function GET() {
  try {
    // Rate limit: skip if synced recently
    if (await shouldSkipSync()) {
      return NextResponse.json({
        status: 'skipped',
        reason: 'synced within last 20 hours',
      });
    }

    // Fetch all records from HubSpot custom object
    console.log('[managed-accounts-sync] Fetching from HubSpot...');
    const records = await fetchAllManagedAccounts();
    console.log(`[managed-accounts-sync] Fetched ${records.length} records`);

    if (records.length === 0) {
      await markSyncRun();
      return NextResponse.json({
        status: 'complete',
        records: 0,
        message: 'No managed account records found in HubSpot',
      });
    }

    // Truncate and reload managed_accounts
    await pool.query('TRUNCATE managed_accounts');

    // Insert in batches
    const batchSize = 50;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const values: unknown[] = [];
      const placeholders: string[] = [];

      for (let j = 0; j < batch.length; j++) {
        const r = batch[j];
        const offset = j * 5;
        placeholders.push(
          `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`
        );
        values.push(
          r.advisor_name || 'Unknown',
          parseFloat(r.current_value || r.bd_market_value || '0') || 0,
          parseFloat(r.fee_rate_bps || '0') || 0,
          parseFloat(r.monthly_fee_amount || '0') || 0,
          r.hubspot_object_id || null
        );
      }

      await pool.query(
        `INSERT INTO managed_accounts (advisor_name, current_value, fee_rate_bps, monthly_fee_amount, hubspot_object_id)
         VALUES ${placeholders.join(', ')}`,
        values
      );
    }

    // Rebuild summary table: simple avg for fee_rate_bps (sum / count)
    await pool.query('TRUNCATE managed_accounts_summary');
    await pool.query(`
      INSERT INTO managed_accounts_summary (advisor_name, total_aum, total_monthly_revenue, account_count, weighted_fee_bps, synced_at)
      SELECT
        advisor_name,
        COALESCE(SUM(current_value), 0) as total_aum,
        COALESCE(SUM(monthly_fee_amount), 0) as total_monthly_revenue,
        COUNT(*) as account_count,
        CASE
          WHEN COUNT(*) > 0
          THEN COALESCE(SUM(fee_rate_bps), 0) / COUNT(*)
          ELSE 0
        END as avg_fee_bps,
        NOW() as synced_at
      FROM managed_accounts
      WHERE advisor_name IS NOT NULL AND advisor_name != ''
      GROUP BY advisor_name
    `);

    // Mark sync timestamp
    await markSyncRun();

    const summaryCount = await pool.query('SELECT COUNT(*) as cnt FROM managed_accounts_summary');
    console.log(
      `[managed-accounts-sync] Complete — ${records.length} accounts, ${summaryCount.rows[0].cnt} advisors`
    );

    return NextResponse.json({
      status: 'complete',
      records: records.length,
      advisors: parseInt(summaryCount.rows[0].cnt),
    });
  } catch (err) {
    console.error('[managed-accounts-sync]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
