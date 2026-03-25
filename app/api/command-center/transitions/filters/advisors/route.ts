import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        advisor_name,
        COUNT(DISTINCT household_name) as household_count,
        COUNT(*) as account_count,
        COUNT(*) FILTER (WHERE status_of_iaa = 'Completed' OR LOWER(docusign_iaa_status) = 'completed') as iaa_complete,
        COUNT(*) FILTER (WHERE status_of_account_paperwork = 'Completed' OR LOWER(docusign_paperwork_status) = 'completed') as pw_complete
      FROM transition_clients
      WHERE advisor_name IS NOT NULL AND advisor_name != ''
      GROUP BY advisor_name
      ORDER BY advisor_name
    `);

    return NextResponse.json({
      advisors: result.rows.map(r => ({
        name: r.advisor_name,
        label: `${r.advisor_name} (${r.household_count} HH · ${r.account_count} Accts)`,
        household_count: parseInt(r.household_count),
        account_count: parseInt(r.account_count),
        iaa_complete: parseInt(r.iaa_complete),
        pw_complete: parseInt(r.pw_complete),
      }))
    });
  } catch (err) {
    console.error('[transitions/filters/advisors]', err);
    return NextResponse.json({ advisors: [] });
  }
}

export const dynamic = 'force-dynamic';
