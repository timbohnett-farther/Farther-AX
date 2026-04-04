import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ── Types ────────────────────────────────────────────────────────────────────

interface TransitionClientRow {
  id: number;
  sheet_id: string | null;
  workbook_name: string | null;
  advisor_name: string | null;
  farther_contact: string | null;
  household_name: string | null;
  account_type: string | null;
  account_name: string | null;
  status_of_iaa: string | null;
  status_of_account_paperwork: string | null;
  portal_status: string | null;
  document_readiness: string | null;
  primary_first_name: string | null;
  primary_last_name: string | null;
  primary_email: string | null;
  new_account_number: string | null;
  contra_account_firm: string | null;
  contra_account_numbers: string | null;
  fee_schedule: string | null;
  notes: string | null;
  docusign_iaa_status: string | null;
  docusign_paperwork_status: string | null;
  billing_setup: string | null;
  welcome_gift_box: string | null;
  portal_invites: string | null;
}

interface AdvisorGroup {
  advisor_name: string;
  farther_contact: string | null;
  sheet_url: string | null;
  total_accounts: number;
  tran_aum: number | null;
  revenue: number | null;
  accounts: TransitionClientRow[];
}

// ── GET handler ───────────────────────────────────────────────────────────────

// Cache waterfall: Redis (L1) → PostgreSQL (L2, existing)
// Transitions use dynamic query params, so cache key includes the full query string.
export async function GET(req: NextRequest) {
  try {
    const { getFromRedis, setInRedis } = await import('@/lib/redis-client');

    // Build cache key from query params
    const cacheKey = `transitions:${req.nextUrl.search || 'default'}`;
    const cached = await getFromRedis<ReturnType<typeof NextResponse.json>>('transitions', req.nextUrl.search || 'default');
    if (cached) {
      const res = NextResponse.json(cached);
      res.headers.set('X-Cache', 'REDIS');
      return res;
    }

    // ── Parse filter params ────────────────────────────────────────────────
    const { searchParams } = req.nextUrl;
    const advisor = searchParams.get('advisor');
    const iaaStatus = searchParams.get('iaa_status');
    const pwStatus = searchParams.get('pw_status');
    const portalStatus = searchParams.get('portal_status');
    const household = searchParams.get('household');
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const perPage = Math.min(200, Math.max(1, parseInt(searchParams.get('per_page') ?? '50')));

    const filterParams: string[] = [];
    const conditions: string[] = [];

    if (advisor) { filterParams.push(advisor); conditions.push(`advisor_name = $${filterParams.length}`); }
    if (iaaStatus) { filterParams.push(iaaStatus); conditions.push(`status_of_iaa = $${filterParams.length}`); }
    if (pwStatus) { filterParams.push(pwStatus); conditions.push(`status_of_account_paperwork = $${filterParams.length}`); }
    if (portalStatus) { filterParams.push(portalStatus); conditions.push(`portal_status = $${filterParams.length}`); }
    if (household) { filterParams.push(`%${household}%`); conditions.push(`household_name ILIKE $${filterParams.length}`); }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // ── Count total matching rows ──────────────────────────────────────────
    const countQuery = `SELECT COUNT(*) as total FROM transition_clients ${whereClause}`;
    const countResult = await prisma.$queryRawUnsafe<Array<{ total: bigint }>>(
      countQuery,
      ...filterParams
    );
    const total = parseInt(countResult[0].total.toString());

    // ── Fetch paginated rows ───────────────────────────────────────────────
    const offset = (page - 1) * perPage;
    const paginationParams = [...filterParams, perPage, offset];
    const limitIdx = filterParams.length + 1;
    const offsetIdx = filterParams.length + 2;

    const selectQuery = `
      SELECT
        id,
        sheet_id,
        workbook_name,
        advisor_name,
        farther_contact,
        household_name,
        account_type,
        account_name,
        status_of_iaa,
        status_of_account_paperwork,
        portal_status,
        document_readiness,
        primary_first_name,
        primary_last_name,
        primary_email,
        new_account_number,
        contra_account_firm,
        contra_account_numbers,
        fee_schedule,
        notes,
        docusign_iaa_status,
        docusign_paperwork_status,
        billing_setup,
        welcome_gift_box,
        portal_invites
      FROM transition_clients
      ${whereClause}
      ORDER BY advisor_name ASC, id ASC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const rows = await prisma.$queryRawUnsafe<TransitionClientRow[]>(
      selectQuery,
      ...paginationParams
    );

    // ── Fetch TRAN AUM & Revenue data ────────────────────────────────────────
    const tranAumResult = await prisma.$queryRaw<Array<{
      advisor_name: string;
      tran_aum: string;
      revenue: string;
    }>>`
      SELECT advisor_name, tran_aum, revenue
      FROM advisor_tran_aum
    `;

    const tranAumMap = new Map<string, { tran_aum: number; revenue: number }>();
    for (const row of tranAumResult) {
      tranAumMap.set(row.advisor_name, {
        tran_aum: parseFloat(row.tran_aum) || 0,
        revenue: parseFloat(row.revenue) || 0,
      });
    }

    // ── Group by advisor ─────────────────────────────────────────────────────
    const advisorMap = new Map<string, AdvisorGroup>();

    for (const row of rows) {
      const key = row.advisor_name ?? 'Unknown Advisor';
      if (!advisorMap.has(key)) {
        const tranAumData = tranAumMap.get(key);
        advisorMap.set(key, {
          advisor_name: key,
          farther_contact: row.farther_contact,
          sheet_url: row.sheet_id ? `https://docs.google.com/spreadsheets/d/${row.sheet_id}` : null,
          total_accounts: 0,
          tran_aum: tranAumData?.tran_aum ?? null,
          revenue: tranAumData?.revenue ?? null,
          accounts: [],
        });
      }
      const group = advisorMap.get(key)!;
      group.accounts.push(row);
      group.total_accounts += 1;
    }

    const advisors = Array.from(advisorMap.values());

    // ── Summary stats ────────────────────────────────────────────────────────
    // IAA signed: status_of_iaa = 'Completed' OR docusign_iaa_status = 'completed'
    const iaa_signed = rows.filter(
      r =>
        r.status_of_iaa === 'Completed' ||
        r.docusign_iaa_status?.toLowerCase() === 'completed',
    ).length;

    // Paperwork signed: status_of_account_paperwork = 'Completed' OR docusign_paperwork_status = 'completed'
    const paperwork_signed = rows.filter(
      r =>
        r.status_of_account_paperwork === 'Completed' ||
        r.docusign_paperwork_status?.toLowerCase() === 'completed',
    ).length;

    // Pending documents: document_readiness is not 'Ready to Send Documents' and not blank
    const pending_documents = rows.filter(
      r =>
        r.document_readiness &&
        r.document_readiness !== 'Ready to Send Documents',
    ).length;

    // ── Last synced timestamp ──────────────────────────────────────────────────
    const syncTimeResult = await prisma.$queryRaw<Array<{ last_synced: Date | null }>>`
      SELECT MAX(synced_at) AS last_synced FROM transition_clients
    `;
    const lastSyncedAt = syncTimeResult[0]?.last_synced?.toISOString() ?? null;

    const responseData = {
      advisors,
      lastSyncedAt,
      total,
      page,
      per_page: perPage,
      summary: {
        total_advisors: advisors.length,
        total_accounts: rows.length,
        iaa_signed,
        paperwork_signed,
        pending_documents,
      },
    };

    // Backfill Redis for next request (non-blocking)
    setInRedis('transitions', req.nextUrl.search || 'default', responseData).catch(() => {});

    const res = NextResponse.json(responseData);
    res.headers.set('X-Cache', 'ORIGIN');
    return res;
  } catch (err) {
    console.error('[transitions GET]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
