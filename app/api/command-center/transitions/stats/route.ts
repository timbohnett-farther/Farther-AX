import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const advisor = searchParams.get('advisor');
    const iaaStatus = searchParams.get('iaa_status');
    const pwStatus = searchParams.get('pw_status');
    const portalStatus = searchParams.get('portal_status');
    const household = searchParams.get('household');

    const params: string[] = [];
    const conditions: string[] = [];

    if (advisor) { params.push(advisor); conditions.push(`advisor_name = $${params.length}`); }
    if (iaaStatus) { params.push(iaaStatus); conditions.push(`status_of_iaa = $${params.length}`); }
    if (pwStatus) { params.push(pwStatus); conditions.push(`status_of_account_paperwork = $${params.length}`); }
    if (portalStatus) { params.push(portalStatus); conditions.push(`portal_status = $${params.length}`); }
    if (household) { params.push(`%${household}%`); conditions.push(`household_name ILIKE $${params.length}`); }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT
        COUNT(DISTINCT advisor_name) as total_advisors,
        COUNT(*) as total_accounts,
        COUNT(DISTINCT household_name) as total_households,
        COUNT(*) FILTER (WHERE status_of_iaa = 'Completed' OR LOWER(docusign_iaa_status) = 'completed') as iaa_signed,
        COUNT(*) FILTER (WHERE status_of_account_paperwork = 'Completed' OR LOWER(docusign_paperwork_status) = 'completed') as paperwork_signed,
        COUNT(*) FILTER (WHERE portal_status IN ('Complete', 'Active', 'Portal Created')) as portal_complete,
        COUNT(*) FILTER (WHERE document_readiness IS NOT NULL AND document_readiness != 'Ready to Send Documents' AND document_readiness != '') as pending_documents,
        COUNT(*) FILTER (WHERE document_readiness = 'Ready to Send Documents') as ready_count
      FROM transition_clients
      ${whereClause}
    `;

    const result = await prisma.$queryRawUnsafe<Array<{
      total_advisors: bigint;
      total_accounts: bigint;
      total_households: bigint;
      iaa_signed: bigint;
      paperwork_signed: bigint;
      portal_complete: bigint;
      pending_documents: bigint;
      ready_count: bigint;
    }>>(query, ...params);

    const row = result[0];
    const totalAccounts = parseInt(row.total_accounts.toString()) || 1;

    return NextResponse.json({
      total_advisors: parseInt(row.total_advisors.toString()),
      total_accounts: parseInt(row.total_accounts.toString()),
      total_households: parseInt(row.total_households.toString()),
      iaa_signed: parseInt(row.iaa_signed.toString()),
      paperwork_signed: parseInt(row.paperwork_signed.toString()),
      portal_complete: parseInt(row.portal_complete.toString()),
      pending_documents: parseInt(row.pending_documents.toString()),
      ready_count: parseInt(row.ready_count.toString()),
      completion_pct: Math.round(
        ((parseInt(row.iaa_signed.toString()) + parseInt(row.paperwork_signed.toString()) + parseInt(row.portal_complete.toString())) /
         (totalAccounts * 3)) * 100
      ),
    });
  } catch (err) {
    console.error('[transitions/stats]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
