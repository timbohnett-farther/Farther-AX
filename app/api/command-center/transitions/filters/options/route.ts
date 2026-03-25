import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const advisor = req.nextUrl.searchParams.get('advisor');
    const params: string[] = [];
    let whereClause = 'WHERE 1=1';
    if (advisor) {
      params.push(advisor);
      whereClause += ` AND advisor_name = $${params.length}`;
    }

    const [iaaResult, pwResult, portalResult, readinessResult] = await Promise.all([
      pool.query(`SELECT DISTINCT status_of_iaa as val FROM transition_clients ${whereClause} AND status_of_iaa IS NOT NULL AND status_of_iaa != '' ORDER BY 1`, params),
      pool.query(`SELECT DISTINCT status_of_account_paperwork as val FROM transition_clients ${whereClause} AND status_of_account_paperwork IS NOT NULL AND status_of_account_paperwork != '' ORDER BY 1`, params),
      pool.query(`SELECT DISTINCT portal_status as val FROM transition_clients ${whereClause} AND portal_status IS NOT NULL AND portal_status != '' ORDER BY 1`, params),
      pool.query(`SELECT DISTINCT document_readiness as val FROM transition_clients ${whereClause} AND document_readiness IS NOT NULL AND document_readiness != '' ORDER BY 1`, params),
    ]);

    return NextResponse.json({
      iaa_statuses: iaaResult.rows.map(r => r.val),
      paperwork_statuses: pwResult.rows.map(r => r.val),
      portal_statuses: portalResult.rows.map(r => r.val),
      readiness_statuses: readinessResult.rows.map(r => r.val),
    });
  } catch (err) {
    console.error('[transitions/filters/options]', err);
    return NextResponse.json({ iaa_statuses: [], paperwork_statuses: [], portal_statuses: [], readiness_statuses: [] });
  }
}

export const dynamic = 'force-dynamic';
