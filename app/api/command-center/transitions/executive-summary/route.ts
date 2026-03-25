import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// ── Types ────────────────────────────────────────────────────────────────────

interface AdvisorSummary {
  advisor_name: string;
  total_accounts: number;
  total_households: number;
  iaa_complete: number;
  iaa_pct: number;
  paperwork_complete: number;
  paperwork_pct: number;
  portal_complete: number;
  portal_pct: number;
  overall_pct: number;
}

// ── GET handler ──────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const result = await pool.query<{
      advisor_name: string;
      total_accounts: string;
      total_households: string;
      iaa_complete: string;
      paperwork_complete: string;
      portal_complete: string;
    }>(`
      SELECT
        advisor_name,
        COUNT(*)::TEXT AS total_accounts,
        COUNT(DISTINCT household_name)::TEXT AS total_households,
        COUNT(*) FILTER (
          WHERE status_of_iaa = 'Completed'
             OR LOWER(docusign_iaa_status) = 'completed'
        )::TEXT AS iaa_complete,
        COUNT(*) FILTER (
          WHERE status_of_account_paperwork = 'Completed'
             OR LOWER(docusign_paperwork_status) = 'completed'
        )::TEXT AS paperwork_complete,
        COUNT(*) FILTER (
          WHERE portal_status IN ('Complete', 'Active', 'Portal Created')
        )::TEXT AS portal_complete
      FROM transition_clients
      WHERE advisor_name IS NOT NULL
      GROUP BY advisor_name
      ORDER BY advisor_name ASC
    `);

    const advisors: AdvisorSummary[] = result.rows.map((row) => {
      const total = parseInt(row.total_accounts, 10);
      const iaa = parseInt(row.iaa_complete, 10);
      const paperwork = parseInt(row.paperwork_complete, 10);
      const portal = parseInt(row.portal_complete, 10);

      const totalSteps = total * 3; // IAA + Paperwork + Portal per account
      const completedSteps = iaa + paperwork + portal;

      return {
        advisor_name: row.advisor_name,
        total_accounts: total,
        total_households: parseInt(row.total_households, 10),
        iaa_complete: iaa,
        iaa_pct: total > 0 ? Math.round((iaa / total) * 100) : 0,
        paperwork_complete: paperwork,
        paperwork_pct: total > 0 ? Math.round((paperwork / total) * 100) : 0,
        portal_complete: portal,
        portal_pct: total > 0 ? Math.round((portal / total) * 100) : 0,
        overall_pct:
          totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0,
      };
    });

    return NextResponse.json({ advisors });
  } catch (err) {
    console.error('[transitions/executive-summary]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
