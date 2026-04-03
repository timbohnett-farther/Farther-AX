import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const result = await prisma.$queryRaw<Array<{
      advisor_name: string;
      household_count: bigint;
      account_count: bigint;
      iaa_complete: bigint;
      pw_complete: bigint;
    }>>`
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
    `;

    return NextResponse.json({
      advisors: result.map(r => ({
        name: r.advisor_name,
        label: `${r.advisor_name} (${r.household_count} HH · ${r.account_count} Accts)`,
        household_count: parseInt(r.household_count.toString()),
        account_count: parseInt(r.account_count.toString()),
        iaa_complete: parseInt(r.iaa_complete.toString()),
        pw_complete: parseInt(r.pw_complete.toString()),
      }))
    });
  } catch (err) {
    console.error('[transitions/filters/advisors]', err);
    return NextResponse.json({ advisors: [] });
  }
}

export const dynamic = 'force-dynamic';
