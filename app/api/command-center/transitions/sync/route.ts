import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

// ── Types ────────────────────────────────────────────────────────────────────

interface TransitionRecord {
  farther_contact: string;
  advisor_name: string;
  custodian: string;
  document_readiness: string;
  status_of_iaa: string;
  status_of_account_paperwork: string;
  portal_status: string;
  household_name: string;
  billing_group: string;
  primary_first_name: string;
  primary_middle_name: string;
  primary_last_name: string;
  primary_email: string;
  primary_phone: string;
  primary_dob: string;
  primary_ssn_last4: string;
  primary_street: string;
  primary_city: string;
  primary_state: string;
  primary_zip: string;
  primary_country: string;
  secondary_first_name: string;
  secondary_middle_name: string;
  secondary_last_name: string;
  secondary_email: string;
  secondary_phone: string;
  secondary_dob: string;
  secondary_ssn_last4: string;
  secondary_street: string;
  secondary_city: string;
  secondary_state: string;
  secondary_zip: string;
  secondary_country: string;
  fee_schedule: string;
  billing_exceptions: string;
  billing_exception_explanation: string;
  contra_account_firm: string;
  contra_account_numbers: string;
  new_account_number: string;
  account_type: string;
  account_name: string;
  mailing_street: string;
  mailing_city: string;
  mailing_state: string;
  mailing_zip: string;
  mailing_country: string;
  portal_invites: string;
  welcome_gift_box: string;
  notes: string;
  billing_setup: string;
}

// ── Header → field mapping ────────────────────────────────────────────────────
// Resolves a raw sheet header string to a TransitionRecord field name.
// Returns null when the header has no matching field.
function resolveHeader(
  header: string,
  lcityCount: number,
): keyof TransitionRecord | null {
  const h = header.trim();
  const hl = h.toLowerCase();

  // Simple exact matches first
  const exactMap: Record<string, keyof TransitionRecord> = {
    'Farther Contact': 'farther_contact',
    'Advisor Name': 'advisor_name',
    'Custodian': 'custodian',
    'Not Ready / Ready to Send Documents': 'document_readiness',
    'Status of IAA': 'status_of_iaa',
    'Status of Account Paperwork': 'status_of_account_paperwork',
    'Portal Status': 'portal_status',
    'Primary Account Holder Email': 'primary_email',
    'Fee Schedule': 'fee_schedule',
    'Billing Exceptions': 'billing_exceptions',
    'Billing Exception Explanation': 'billing_exception_explanation',
    'Account Type': 'account_type',
    'Notes': 'notes',
    'Billing Setup': 'billing_setup',
    // Address city/state/zip/country columns share the same header names —
    // caller tracks which occurrence this is via lcityCount.
    'LCity': lcityCount === 0 ? 'primary_city' : 'secondary_city',
    'LState': lcityCount === 0 ? 'primary_state' : 'secondary_state',
    'LZip': lcityCount === 0 ? 'primary_zip' : 'secondary_zip',
    'Lcountry': lcityCount === 0 ? 'primary_country' : 'secondary_country',
    'Mcity': 'mailing_city',
    'MSt': 'mailing_state',
    'Mzip': 'mailing_zip',
    'Mcountry': 'mailing_country',
  };

  if (exactMap[h] !== undefined) return exactMap[h];

  // Flexible substring / keyword matching for multi-line / variant headers
  if (hl.includes('household name')) return 'household_name';
  if (hl.includes('billing group')) return 'billing_group';

  // Primary fields
  if (hl.includes('primary') && hl.includes('first name')) return 'primary_first_name';
  if (hl.includes('primary') && hl.includes('middle name')) return 'primary_middle_name';
  if (hl.includes('primary') && hl.includes('last name')) return 'primary_last_name';
  if (hl.includes('primary') && hl.includes('cell')) return 'primary_phone';
  if (hl.includes('primary') && hl.includes('date of birth')) return 'primary_dob';
  if (hl.includes('primary') && hl.includes('ssn')) return 'primary_ssn_last4';
  if (hl.includes('primary') && hl.includes('street')) return 'primary_street';

  // Secondary fields
  if (hl.includes('secondary') && hl.includes('first name')) return 'secondary_first_name';
  if (hl.includes('secondary') && hl.includes('middle name')) return 'secondary_middle_name';
  if (hl.includes('secondary') && hl.includes('last name')) return 'secondary_last_name';
  if (hl.includes('secondary') && (hl.includes('email') || hl.includes('e-mail'))) return 'secondary_email';
  if (hl.includes('secondary') && hl.includes('cell')) return 'secondary_phone';
  if (hl.includes('secondary') && hl.includes('date of birth')) return 'secondary_dob';
  if (hl.includes('secondary') && hl.includes('ssn')) return 'secondary_ssn_last4';
  if (hl.includes('secondary') && hl.includes('street')) return 'secondary_street';

  if (hl.includes('contra account firm')) return 'contra_account_firm';
  if (hl.includes('contra account number')) return 'contra_account_numbers';
  if (hl.includes('new account number')) return 'new_account_number';
  if (hl.includes('account name') || hl.includes('entity name')) return 'account_name';
  if (hl.includes('account mailing')) return 'mailing_street';
  if (hl.includes('portal invites')) return 'portal_invites';
  if (hl.includes('gift box')) return 'welcome_gift_box';

  return null;
}

// ── Parse a single sheet row into a TransitionRecord ─────────────────────────
function parseRow(
  headers: string[],
  cells: string[],
  fieldIndex: Map<keyof TransitionRecord, number>,
): Partial<TransitionRecord> {
  const record = {} as Record<keyof TransitionRecord, string>;

  // Use Array.from so iteration works regardless of TypeScript target setting
  Array.from(fieldIndex.entries()).forEach(([field, colIdx]) => {
    const raw = (cells[colIdx] ?? '').trim();

    // SSN: only store last 4 digits for security
    if (field === 'primary_ssn_last4' || field === 'secondary_ssn_last4') {
      const digits = raw.replace(/\D/g, '');
      record[field] = digits.length >= 4 ? digits.slice(-4) : digits;
      return;
    }

    record[field] = raw;
  });

  return record;
}

// ── Build the field→column index map from header row ─────────────────────────
// This runs once per sync so the per-row lookup is O(1).
function buildFieldIndex(headers: string[]): Map<keyof TransitionRecord, number> {
  const index = new Map<keyof TransitionRecord, number>();
  // lcityCount tracks how many times we've seen LCity so we can distinguish
  // primary (first occurrence) vs secondary (second occurrence) address columns.
  let lcityCount = 0;

  for (let i = 0; i < headers.length; i++) {
    const field = resolveHeader(headers[i], lcityCount);
    if (field === null) continue;

    // Only assign the first occurrence for each field (later duplicates ignored)
    // EXCEPT for the lcity family — those get assigned twice intentionally via lcityCount.
    if (!index.has(field)) {
      index.set(field, i);
    }

    // Advance lcityCount after we've processed the primary city group so that
    // the NEXT occurrence of LCity maps to the secondary set.
    if (headers[i] === 'LCity') {
      lcityCount += 1;
    }
  }

  return index;
}

// ── POST handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // Auth check — we need the Google access token to call Sheets API
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const accessToken = (session as unknown as Record<string, unknown>).access_token as string | undefined;
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No Google access token on session. Please sign out and sign in again.' },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { sheetId, sheetRange } = body as { sheetId?: string; sheetRange?: string };

    if (!sheetId) {
      return NextResponse.json({ error: 'sheetId is required' }, { status: 400 });
    }

    const range = sheetRange ?? 'Transition!A1:AQ';

    // ── Fetch from Google Sheets API v4 ─────────────────────────────────────
    const sheetsUrl =
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`;

    const sheetsRes = await fetch(sheetsUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!sheetsRes.ok) {
      const errText = await sheetsRes.text();
      console.error('[transitions/sync] Google Sheets error:', sheetsRes.status, errText);
      return NextResponse.json(
        { error: `Google Sheets API error ${sheetsRes.status}: ${errText}` },
        { status: 502 },
      );
    }

    const sheetsData = await sheetsRes.json();
    const allRows: string[][] = sheetsData.values ?? [];

    if (allRows.length < 2) {
      return NextResponse.json({ synced: 0, total: 0 });
    }

    // First row is headers; remaining rows are data
    const headers = allRows[0];
    const dataRows = allRows.slice(1);
    const fieldIndex = buildFieldIndex(headers);

    // ── Upsert each row into transition_clients ──────────────────────────────
    let synced = 0;

    for (let i = 0; i < dataRows.length; i++) {
      const cells = dataRows[i];

      // Skip fully empty rows
      if (cells.every(c => !c.trim())) continue;

      const record = parseRow(headers, cells, fieldIndex);

      // sheet_row_index is 1-based (row 2 in the sheet = index 1 here since headers are row 1)
      const sheetRowIndex = i + 1;

      await pool.query(
        `
        INSERT INTO transition_clients (
          sheet_id,
          sheet_row_index,
          farther_contact,
          advisor_name,
          custodian,
          document_readiness,
          status_of_iaa,
          status_of_account_paperwork,
          portal_status,
          household_name,
          billing_group,
          primary_first_name,
          primary_middle_name,
          primary_last_name,
          primary_email,
          primary_phone,
          primary_dob,
          primary_ssn_last4,
          primary_street,
          primary_city,
          primary_state,
          primary_zip,
          primary_country,
          secondary_first_name,
          secondary_middle_name,
          secondary_last_name,
          secondary_email,
          secondary_phone,
          secondary_dob,
          secondary_ssn_last4,
          secondary_street,
          secondary_city,
          secondary_state,
          secondary_zip,
          secondary_country,
          fee_schedule,
          billing_exceptions,
          billing_exception_explanation,
          contra_account_firm,
          contra_account_numbers,
          new_account_number,
          account_type,
          account_name,
          mailing_street,
          mailing_city,
          mailing_state,
          mailing_zip,
          mailing_country,
          portal_invites,
          welcome_gift_box,
          notes,
          billing_setup,
          synced_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
          $31, $32, $33, $34, $35, $36, $37, $38, $39, $40,
          $41, $42, $43, $44, $45, $46, $47, $48, $49, $50,
          $51, $52, NOW()
        )
        ON CONFLICT (sheet_id, sheet_row_index) DO UPDATE SET
          farther_contact                = EXCLUDED.farther_contact,
          advisor_name                   = EXCLUDED.advisor_name,
          custodian                      = EXCLUDED.custodian,
          document_readiness             = EXCLUDED.document_readiness,
          status_of_iaa                  = EXCLUDED.status_of_iaa,
          status_of_account_paperwork    = EXCLUDED.status_of_account_paperwork,
          portal_status                  = EXCLUDED.portal_status,
          household_name                 = EXCLUDED.household_name,
          billing_group                  = EXCLUDED.billing_group,
          primary_first_name             = EXCLUDED.primary_first_name,
          primary_middle_name            = EXCLUDED.primary_middle_name,
          primary_last_name              = EXCLUDED.primary_last_name,
          primary_email                  = EXCLUDED.primary_email,
          primary_phone                  = EXCLUDED.primary_phone,
          primary_dob                    = EXCLUDED.primary_dob,
          primary_ssn_last4              = EXCLUDED.primary_ssn_last4,
          primary_street                 = EXCLUDED.primary_street,
          primary_city                   = EXCLUDED.primary_city,
          primary_state                  = EXCLUDED.primary_state,
          primary_zip                    = EXCLUDED.primary_zip,
          primary_country                = EXCLUDED.primary_country,
          secondary_first_name           = EXCLUDED.secondary_first_name,
          secondary_middle_name          = EXCLUDED.secondary_middle_name,
          secondary_last_name            = EXCLUDED.secondary_last_name,
          secondary_email                = EXCLUDED.secondary_email,
          secondary_phone                = EXCLUDED.secondary_phone,
          secondary_dob                  = EXCLUDED.secondary_dob,
          secondary_ssn_last4            = EXCLUDED.secondary_ssn_last4,
          secondary_street               = EXCLUDED.secondary_street,
          secondary_city                 = EXCLUDED.secondary_city,
          secondary_state                = EXCLUDED.secondary_state,
          secondary_zip                  = EXCLUDED.secondary_zip,
          secondary_country              = EXCLUDED.secondary_country,
          fee_schedule                   = EXCLUDED.fee_schedule,
          billing_exceptions             = EXCLUDED.billing_exceptions,
          billing_exception_explanation  = EXCLUDED.billing_exception_explanation,
          contra_account_firm            = EXCLUDED.contra_account_firm,
          contra_account_numbers         = EXCLUDED.contra_account_numbers,
          new_account_number             = EXCLUDED.new_account_number,
          account_type                   = EXCLUDED.account_type,
          account_name                   = EXCLUDED.account_name,
          mailing_street                 = EXCLUDED.mailing_street,
          mailing_city                   = EXCLUDED.mailing_city,
          mailing_state                  = EXCLUDED.mailing_state,
          mailing_zip                    = EXCLUDED.mailing_zip,
          mailing_country                = EXCLUDED.mailing_country,
          portal_invites                 = EXCLUDED.portal_invites,
          welcome_gift_box               = EXCLUDED.welcome_gift_box,
          notes                          = EXCLUDED.notes,
          billing_setup                  = EXCLUDED.billing_setup,
          synced_at                      = NOW()
        `,
        [
          sheetId,
          sheetRowIndex,
          record.farther_contact ?? null,
          record.advisor_name ?? null,
          record.custodian ?? null,
          record.document_readiness ?? null,
          record.status_of_iaa ?? null,
          record.status_of_account_paperwork ?? null,
          record.portal_status ?? null,
          record.household_name ?? null,
          record.billing_group ?? null,
          record.primary_first_name ?? null,
          record.primary_middle_name ?? null,
          record.primary_last_name ?? null,
          record.primary_email ?? null,
          record.primary_phone ?? null,
          record.primary_dob ?? null,
          record.primary_ssn_last4 ?? null,
          record.primary_street ?? null,
          record.primary_city ?? null,
          record.primary_state ?? null,
          record.primary_zip ?? null,
          record.primary_country ?? null,
          record.secondary_first_name ?? null,
          record.secondary_middle_name ?? null,
          record.secondary_last_name ?? null,
          record.secondary_email ?? null,
          record.secondary_phone ?? null,
          record.secondary_dob ?? null,
          record.secondary_ssn_last4 ?? null,
          record.secondary_street ?? null,
          record.secondary_city ?? null,
          record.secondary_state ?? null,
          record.secondary_zip ?? null,
          record.secondary_country ?? null,
          record.fee_schedule ?? null,
          record.billing_exceptions ?? null,
          record.billing_exception_explanation ?? null,
          record.contra_account_firm ?? null,
          record.contra_account_numbers ?? null,
          record.new_account_number ?? null,
          record.account_type ?? null,
          record.account_name ?? null,
          record.mailing_street ?? null,
          record.mailing_city ?? null,
          record.mailing_state ?? null,
          record.mailing_zip ?? null,
          record.mailing_country ?? null,
          record.portal_invites ?? null,
          record.welcome_gift_box ?? null,
          record.notes ?? null,
          record.billing_setup ?? null,
        ],
      );

      synced += 1;
    }

    return NextResponse.json({ synced, total: dataRows.length });
  } catch (err) {
    console.error('[transitions/sync]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
