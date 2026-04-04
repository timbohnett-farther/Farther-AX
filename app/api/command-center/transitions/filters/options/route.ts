import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const advisor = req.nextUrl.searchParams.get('advisor');
    const params: string[] = [];
    let whereClause = 'WHERE 1=1';
    if (advisor) {
      params.push(advisor);
      whereClause += ` AND advisor_name = $${params.length}`;
    }

    const iaaQuery = `SELECT DISTINCT status_of_iaa as val FROM transition_clients ${whereClause} AND status_of_iaa IS NOT NULL AND status_of_iaa != '' ORDER BY 1`;
    const pwQuery = `SELECT DISTINCT status_of_account_paperwork as val FROM transition_clients ${whereClause} AND status_of_account_paperwork IS NOT NULL AND status_of_account_paperwork != '' ORDER BY 1`;
    const portalQuery = `SELECT DISTINCT portal_status as val FROM transition_clients ${whereClause} AND portal_status IS NOT NULL AND portal_status != '' ORDER BY 1`;
    const readinessQuery = `SELECT DISTINCT document_readiness as val FROM transition_clients ${whereClause} AND document_readiness IS NOT NULL AND document_readiness != '' ORDER BY 1`;

    const [iaaResult, pwResult, portalResult, readinessResult] = await Promise.all([
      prisma.$queryRawUnsafe<Array<{ val: string }>>(iaaQuery, ...params),
      prisma.$queryRawUnsafe<Array<{ val: string }>>(pwQuery, ...params),
      prisma.$queryRawUnsafe<Array<{ val: string }>>(portalQuery, ...params),
      prisma.$queryRawUnsafe<Array<{ val: string }>>(readinessQuery, ...params),
    ]);

    return NextResponse.json({
      iaa_statuses: iaaResult.map(r => r.val),
      paperwork_statuses: pwResult.map(r => r.val),
      portal_statuses: portalResult.map(r => r.val),
      readiness_statuses: readinessResult.map(r => r.val),
    });
  } catch (err) {
    console.error('[transitions/filters/options]', err);
    return NextResponse.json({ iaa_statuses: [], paperwork_statuses: [], portal_statuses: [], readiness_statuses: [] });
  }
}

export const dynamic = 'force-dynamic';
