import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

const HUBSPOT_PAT = process.env.HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_PAT || '';
const CUSTOM_OBJECT_TYPE = '2-13676628'; // Farther Managed Accounts

interface HubSpotRecord {
  id: string;
  properties: {
    advisor_name?: string;
    current_value?: string;
    monthly_fee_amount?: string;
  };
}

interface AdvisorAggregation {
  advisor_name: string;
  tran_aum: number;
  revenue: number;
  record_count: number;
}

/**
 * Fetch all records from HubSpot custom object with advisor_name, current_value, monthly_fee_amount
 */
async function fetchAllRecords(): Promise<HubSpotRecord[]> {
  const records: HubSpotRecord[] = [];
  let after = 0;
  const limit = 100;

  console.log(`[tran-aum] Fetching from HubSpot Custom Object: ${CUSTOM_OBJECT_TYPE}`);
  console.log(`[tran-aum] Using token: ${HUBSPOT_PAT ? HUBSPOT_PAT.substring(0, 10) + '...' : 'NOT SET'}`);

  do {
    const body = {
      properties: ['advisor_name', 'current_value', 'monthly_fee_amount'],
      limit,
      after,
    };

    const url = `https://api.hubapi.com/crm/v3/objects/${CUSTOM_OBJECT_TYPE}/search`;

    console.log(`[tran-aum] POST ${url} (offset: ${after})`);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HUBSPOT_PAT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[tran-aum] HubSpot API error ${res.status}:`);
      console.error(`[tran-aum] Response: ${errorText}`);
      console.error(`[tran-aum] Request body:`, JSON.stringify(body, null, 2));
      break;
    }

    const data = await res.json();
    console.log(`[tran-aum] Fetched batch: ${data.results?.length ?? 0} records, total: ${data.total ?? 'unknown'}`);

    if (!data.results || data.results.length === 0) {
      console.log('[tran-aum] No more results, stopping pagination');
      break;
    }

    records.push(...(data.results ?? []));

    // Check if there are more pages
    if (data.paging?.next?.after) {
      after = parseInt(data.paging.next.after);
    } else {
      break;
    }
  } while (true);

  console.log(`[tran-aum] Total records fetched: ${records.length}`);
  return records;
}

/**
 * Aggregate records by advisor_name (SUM current_value, SUM monthly_fee_amount)
 */
function aggregateByAdvisor(records: HubSpotRecord[]): AdvisorAggregation[] {
  const advisorMap = new Map<string, AdvisorAggregation>();

  for (const record of records) {
    const advisorName = (record.properties.advisor_name ?? '').trim();
    if (!advisorName) continue;

    const currentValue = parseFloat(record.properties.current_value ?? '0') || 0;
    const monthlyFee = parseFloat(record.properties.monthly_fee_amount ?? '0') || 0;

    if (!advisorMap.has(advisorName)) {
      advisorMap.set(advisorName, {
        advisor_name: advisorName,
        tran_aum: 0,
        revenue: 0,
        record_count: 0,
      });
    }

    const agg = advisorMap.get(advisorName)!;
    agg.tran_aum += currentValue;
    agg.revenue += monthlyFee;
    agg.record_count += 1;
  }

  return Array.from(advisorMap.values());
}

/**
 * GET /api/command-center/transitions/tran-aum
 * Returns current TRAN AUM & Revenue data by advisor
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const result = await pool.query(`
      SELECT
        advisor_name,
        tran_aum,
        revenue,
        record_count,
        last_synced_at
      FROM advisor_tran_aum
      ORDER BY advisor_name ASC
    `);

    return NextResponse.json({
      advisors: result.rows,
      total: result.rows.length,
    });
  } catch (err) {
    console.error('[tran-aum GET]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/command-center/transitions/tran-aum
 * Sync TRAN AUM & Revenue from HubSpot custom object
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    console.log('[tran-aum] Starting sync from HubSpot...');

    // Fetch all records from HubSpot
    const records = await fetchAllRecords();
    console.log(`[tran-aum] Fetched ${records.length} records from HubSpot`);

    // Log first 3 records as sample
    if (records.length > 0) {
      console.log('[tran-aum] Sample records:');
      records.slice(0, 3).forEach((rec, idx) => {
        console.log(`  Record ${idx + 1}:`, {
          id: rec.id,
          advisor_name: rec.properties.advisor_name,
          current_value: rec.properties.current_value,
          monthly_fee_amount: rec.properties.monthly_fee_amount,
        });
      });
    }

    // Aggregate by advisor
    const aggregations = aggregateByAdvisor(records);
    console.log(`[tran-aum] Aggregated data for ${aggregations.length} advisors`);

    // Log first 3 aggregations as sample
    if (aggregations.length > 0) {
      console.log('[tran-aum] Sample aggregations:');
      aggregations.slice(0, 3).forEach((agg, idx) => {
        console.log(`  Advisor ${idx + 1}:`, {
          advisor_name: agg.advisor_name,
          tran_aum: agg.tran_aum,
          revenue: agg.revenue,
          record_count: agg.record_count,
        });
      });
    }

    // Upsert to database
    let inserted = 0;
    let updated = 0;

    for (const agg of aggregations) {
      const result = await pool.query(
        `
        INSERT INTO advisor_tran_aum (
          advisor_name,
          tran_aum,
          revenue,
          record_count,
          last_synced_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        ON CONFLICT (advisor_name) DO UPDATE SET
          tran_aum = EXCLUDED.tran_aum,
          revenue = EXCLUDED.revenue,
          record_count = EXCLUDED.record_count,
          last_synced_at = NOW(),
          updated_at = NOW()
        RETURNING (xmax = 0) AS inserted
        `,
        [agg.advisor_name, agg.tran_aum, agg.revenue, agg.record_count]
      );

      if (result.rows[0]?.inserted) {
        inserted++;
      } else {
        updated++;
      }
    }

    return NextResponse.json({
      success: true,
      totalRecords: records.length,
      totalAdvisors: aggregations.length,
      inserted,
      updated,
      message: `Synced TRAN AUM for ${aggregations.length} advisors (${inserted} new, ${updated} updated)`,
      sampleRecords: records.slice(0, 3).map(r => ({
        id: r.id,
        advisor_name: r.properties.advisor_name,
        current_value: r.properties.current_value,
        monthly_fee_amount: r.properties.monthly_fee_amount,
      })),
      sampleAggregations: aggregations.slice(0, 5).map(a => ({
        advisor_name: a.advisor_name,
        tran_aum: a.tran_aum,
        revenue: a.revenue,
        record_count: a.record_count,
      })),
    });
  } catch (err) {
    console.error('[tran-aum POST]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
