import { NextResponse } from 'next/server';
import pool from '@/lib/db';

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
  accounts: TransitionClientRow[];
}

// ── GET handler ───────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const result = await pool.query<TransitionClientRow>(`
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
      ORDER BY advisor_name ASC, id ASC
    `);

    const rows = result.rows;

    // ── Group by advisor ─────────────────────────────────────────────────────
    const advisorMap = new Map<string, AdvisorGroup>();

    for (const row of rows) {
      const key = row.advisor_name ?? 'Unknown Advisor';
      if (!advisorMap.has(key)) {
        advisorMap.set(key, {
          advisor_name: key,
          farther_contact: row.farther_contact,
          sheet_url: row.sheet_id ? `https://docs.google.com/spreadsheets/d/${row.sheet_id}` : null,
          total_accounts: 0,
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

    return NextResponse.json({
      advisors,
      summary: {
        total_advisors: advisors.length,
        total_accounts: rows.length,
        iaa_signed,
        paperwork_signed,
        pending_documents,
      },
    });
  } catch (err) {
    console.error('[transitions GET]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
