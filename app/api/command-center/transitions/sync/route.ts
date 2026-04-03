import { NextRequest, NextResponse } from 'next/server';
import { fetchSheetData, listSheetsInFolder, DriveFile } from '@/lib/google-sheets';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

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

function resolveHeader(
  header: string,
  lcityCount: number,
): keyof TransitionRecord | null {
  const h = header.trim();
  const hl = h.toLowerCase();

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

  if (hl.includes('household name')) return 'household_name';
  if (hl.includes('billing group')) return 'billing_group';

  if (hl.includes('primary') && hl.includes('first name')) return 'primary_first_name';
  if (hl.includes('primary') && hl.includes('middle name')) return 'primary_middle_name';
  if (hl.includes('primary') && hl.includes('last name')) return 'primary_last_name';
  if (hl.includes('primary') && hl.includes('cell')) return 'primary_phone';
  if (hl.includes('primary') && hl.includes('date of birth')) return 'primary_dob';
  if (hl.includes('primary') && hl.includes('ssn')) return 'primary_ssn_last4';
  if (hl.includes('primary') && hl.includes('street')) return 'primary_street';

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

// ── Parse helpers ─────────────────────────────────────────────────────────────

function parseRow(
  cells: string[],
  fieldIndex: Map<keyof TransitionRecord, number>,
): Partial<TransitionRecord> {
  const record = {} as Record<keyof TransitionRecord, string>;

  Array.from(fieldIndex.entries()).forEach(([field, colIdx]) => {
    const raw = (cells[colIdx] ?? '').trim();

    if (field === 'primary_ssn_last4' || field === 'secondary_ssn_last4') {
      const digits = raw.replace(/\D/g, '');
      record[field] = digits.length >= 4 ? digits.slice(-4) : digits;
      return;
    }

    record[field] = raw;
  });

  return record;
}

function buildFieldIndex(headers: string[]): Map<keyof TransitionRecord, number> {
  const index = new Map<keyof TransitionRecord, number>();
  let lcityCount = 0;

  for (let i = 0; i < headers.length; i++) {
    const field = resolveHeader(headers[i], lcityCount);
    if (field === null) continue;

    if (!index.has(field)) {
      index.set(field, i);
    }

    if (headers[i] === 'LCity') {
      lcityCount += 1;
    }
  }

  return index;
}

// ── Team Mappings Cache ──────────────────────────────────────────────────────

let teamMappingsCache: Map<string, string> | null = null;
let teamMappingsCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function loadTeamMappings(): Promise<Map<string, string>> {
  const now = Date.now();

  // Return cached if still fresh
  if (teamMappingsCache && now - teamMappingsCacheTime < CACHE_TTL) {
    return teamMappingsCache;
  }

  const result = await prisma.$queryRaw<Array<{ individual_name: string; team_name: string }>>`
    SELECT individual_name, team_name FROM advisor_team_mappings
  `;

  const mappings = new Map<string, string>();
  for (const row of result) {
    mappings.set(row.individual_name.trim(), row.team_name.trim());
  }

  teamMappingsCache = mappings;
  teamMappingsCacheTime = now;

  console.log(`[transitions/sync] Loaded ${mappings.size} team mappings`);
  return mappings;
}

/**
 * Apply team mapping: individual name → team name
 * Returns the team name if mapping exists, otherwise returns original name
 */
function applyTeamMapping(advisorName: string | null, mappings: Map<string, string>): string | null {
  if (!advisorName) return null;

  const trimmed = advisorName.trim();
  if (!trimmed) return null;

  // Check if this individual name maps to a team
  const teamName = mappings.get(trimmed);
  if (teamName) {
    console.log(`[transitions/sync] Mapped "${trimmed}" → "${teamName}"`);
    return teamName;
  }

  return trimmed;
}

// ── Sync a single workbook's Transitions tab ─────────────────────────────────

interface WorkbookResult {
  sheetId: string;
  workbookName: string;
  detectedAdvisor: string | null;
  synced: number;
  total: number;
  mappedCount: number;
  skipped?: boolean;
  error?: string;
}

// ── Incremental sync: check modifiedTime before re-reading sheets ────────────

/**
 * Loads the last known modifiedTime for each workbook from the DB.
 * Used to skip sheets that haven't changed since last sync.
 */
async function loadLastModifiedTimes(): Promise<Map<string, string>> {
  try {
    const result = await prisma.$queryRaw<Array<{ sheet_id: string; drive_modified_time: string }>>`
      SELECT sheet_id, drive_modified_time::text FROM transition_workbooks WHERE drive_modified_time IS NOT NULL
    `;
    const map = new Map<string, string>();
    for (const row of result) {
      map.set(row.sheet_id, row.drive_modified_time);
    }
    return map;
  } catch (err) {
    console.warn('[transitions/sync] Modified time column query failed:', err instanceof Error ? err.message : String(err));
    return new Map();
  }
}

/**
 * Ensure the drive_modified_time column exists on transition_workbooks.
 */
async function ensureModifiedTimeColumn(): Promise<void> {
  try {
    await prisma.$executeRaw`
      ALTER TABLE transition_workbooks
      ADD COLUMN IF NOT EXISTS drive_modified_time TIMESTAMPTZ
    `;
  } catch (err) {
    console.warn('[transitions/sync] Column migration skipped:', err instanceof Error ? err.message : String(err));
  }
}

/**
 * Store the Drive API modifiedTime after successful sync.
 */
async function updateWorkbookModifiedTime(sheetId: string, modifiedTime: string): Promise<void> {
  try {
    await prisma.$executeRaw`
      UPDATE transition_workbooks SET drive_modified_time = ${modifiedTime} WHERE sheet_id = ${sheetId}
    `;
  } catch (err) {
    console.warn('[transitions/sync] Modified time update skipped:', err instanceof Error ? err.message : String(err));
  }
}

async function syncWorkbook(
  sheetId: string,
  workbookName: string,
  range: string,
  teamMappings: Map<string, string>,
): Promise<WorkbookResult> {
  try {
    const allRows = await fetchSheetData(sheetId, range);

    if (allRows.length < 2) {
      return { sheetId, workbookName, detectedAdvisor: null, synced: 0, total: 0, mappedCount: 0 };
    }

    const headers = allRows[0];
    const dataRows = allRows.slice(1);
    const fieldIndex = buildFieldIndex(headers);

    // Detect advisor name from the first non-empty data row
    const advisorColIdx = fieldIndex.get('advisor_name');
    let detectedAdvisor: string | null = null;
    if (advisorColIdx !== undefined) {
      for (const row of dataRows) {
        const val = (row[advisorColIdx] ?? '').trim();
        if (val) {
          // Apply team mapping to detected advisor
          detectedAdvisor = applyTeamMapping(val, teamMappings);
          break;
        }
      }
    }

    // Upsert workbook mapping (don't overwrite locked assignments)
    const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}`;
    await prisma.$executeRaw`
      INSERT INTO transition_workbooks (sheet_id, workbook_name, sheet_url, detected_advisor_name, last_synced_at)
      VALUES (${sheetId}, ${workbookName}, ${sheetUrl}, ${detectedAdvisor}, NOW())
      ON CONFLICT (sheet_id) DO UPDATE SET
        workbook_name          = EXCLUDED.workbook_name,
        sheet_url              = EXCLUDED.sheet_url,
        detected_advisor_name  = EXCLUDED.detected_advisor_name,
        last_synced_at         = NOW()
    `;

    let synced = 0;
    let mappedCount = 0;

    for (let i = 0; i < dataRows.length; i++) {
      const cells = dataRows[i];
      if (cells.every(c => !c.trim())) continue;

      const record = parseRow(cells, fieldIndex);
      const sheetRowIndex = i + 1;

      // Apply team mapping to advisor_name field
      const originalAdvisorName = record.advisor_name ?? null;
      const mappedAdvisorName = applyTeamMapping(originalAdvisorName, teamMappings);

      if (mappedAdvisorName !== originalAdvisorName && mappedAdvisorName !== null) {
        mappedCount++;
      }

      // Replace advisor_name with mapped team name
      record.advisor_name = mappedAdvisorName ?? record.advisor_name;

      await prisma.$executeRaw`
        INSERT INTO transition_clients (
          sheet_id,
          sheet_row_index,
          workbook_name,
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
          ${sheetId}, ${sheetRowIndex}, ${workbookName}, ${record.farther_contact ?? null}, ${record.advisor_name ?? null},
          ${record.custodian ?? null}, ${record.document_readiness ?? null}, ${record.status_of_iaa ?? null},
          ${record.status_of_account_paperwork ?? null}, ${record.portal_status ?? null}, ${record.household_name ?? null},
          ${record.billing_group ?? null}, ${record.primary_first_name ?? null}, ${record.primary_middle_name ?? null},
          ${record.primary_last_name ?? null}, ${record.primary_email ?? null}, ${record.primary_phone ?? null},
          ${record.primary_dob ?? null}, ${record.primary_ssn_last4 ?? null}, ${record.primary_street ?? null},
          ${record.primary_city ?? null}, ${record.primary_state ?? null}, ${record.primary_zip ?? null},
          ${record.primary_country ?? null}, ${record.secondary_first_name ?? null}, ${record.secondary_middle_name ?? null},
          ${record.secondary_last_name ?? null}, ${record.secondary_email ?? null}, ${record.secondary_phone ?? null},
          ${record.secondary_dob ?? null}, ${record.secondary_ssn_last4 ?? null}, ${record.secondary_street ?? null},
          ${record.secondary_city ?? null}, ${record.secondary_state ?? null}, ${record.secondary_zip ?? null},
          ${record.secondary_country ?? null}, ${record.fee_schedule ?? null}, ${record.billing_exceptions ?? null},
          ${record.billing_exception_explanation ?? null}, ${record.contra_account_firm ?? null},
          ${record.contra_account_numbers ?? null}, ${record.new_account_number ?? null}, ${record.account_type ?? null},
          ${record.account_name ?? null}, ${record.mailing_street ?? null}, ${record.mailing_city ?? null},
          ${record.mailing_state ?? null}, ${record.mailing_zip ?? null}, ${record.mailing_country ?? null},
          ${record.portal_invites ?? null}, ${record.welcome_gift_box ?? null}, ${record.notes ?? null},
          ${record.billing_setup ?? null}, NOW()
        )
        ON CONFLICT (sheet_id, sheet_row_index) DO UPDATE SET
          workbook_name                  = EXCLUDED.workbook_name,
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
      `;

      synced += 1;
    }

    return { sheetId, workbookName, detectedAdvisor, synced, total: dataRows.length, mappedCount };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[transitions/sync] Error syncing "${workbookName}" (${sheetId}):`, message);
    return { sheetId, workbookName, detectedAdvisor: null, synced: 0, total: 0, mappedCount: 0, error: message };
  }
}

// ── POST handler ──────────────────────────────────────────────────────────────
// POST with no body → sync all workbooks in the Drive folder
// POST with { sheetId } → sync a single workbook

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { sheetId, sheetRange } = body as { sheetId?: string; sheetRange?: string };

    const range = sheetRange ?? 'Transition!A1:AQ';

    // Load team mappings once
    const teamMappings = await loadTeamMappings();
    console.log(`[transitions/sync] Loaded ${teamMappings.size} team mappings for sync`);

    // ── Single workbook sync ────────────────────────────────────────────────
    if (sheetId) {
      const result = await syncWorkbook(sheetId, '', range, teamMappings);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 502 });
      }
      return NextResponse.json(result);
    }

    // ── Full folder sync (incremental: skip unchanged sheets) ──────────────
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!folderId) {
      return NextResponse.json(
        { error: 'GOOGLE_DRIVE_FOLDER_ID env var is not set' },
        { status: 500 },
      );
    }

    await ensureModifiedTimeColumn();
    const [sheets, lastModifiedTimes] = await Promise.all([
      listSheetsInFolder(folderId),
      loadLastModifiedTimes(),
    ]);

    if (sheets.length === 0) {
      return NextResponse.json({
        workbooks: [],
        summary: { total_workbooks: 0, total_synced: 0, total_rows: 0, total_mapped: 0, skipped: 0, errors: 0 },
      });
    }

    const results: WorkbookResult[] = [];
    let skippedCount = 0;

    for (const sheet of sheets) {
      // Skip sheets that haven't been modified since last sync
      const lastKnown = lastModifiedTimes.get(sheet.id);
      if (lastKnown && sheet.modifiedTime && new Date(sheet.modifiedTime) <= new Date(lastKnown)) {
        console.log(`[transitions/sync] Skipping "${sheet.name}" (unchanged since ${lastKnown})`);
        results.push({
          sheetId: sheet.id, workbookName: sheet.name, detectedAdvisor: null,
          synced: 0, total: 0, mappedCount: 0, skipped: true,
        });
        skippedCount++;
        continue;
      }

      console.log(`[transitions/sync] Syncing "${sheet.name}" (${sheet.id})…`);
      const result = await syncWorkbook(sheet.id, sheet.name, range, teamMappings);
      results.push(result);

      // Store modifiedTime after successful sync
      if (!result.error && sheet.modifiedTime) {
        await updateWorkbookModifiedTime(sheet.id, sheet.modifiedTime);
      }
    }

    const totalSynced = results.reduce((sum, r) => sum + r.synced, 0);
    const totalRows = results.reduce((sum, r) => sum + r.total, 0);
    const totalMapped = results.reduce((sum, r) => sum + r.mappedCount, 0);
    const errors = results.filter(r => r.error).length;

    return NextResponse.json({
      workbooks: results,
      summary: {
        total_workbooks: sheets.length,
        total_synced: totalSynced,
        total_rows: totalRows,
        total_mapped: totalMapped,
        skipped: skippedCount,
        errors,
      },
    });
  } catch (err) {
    console.error('[transitions/sync]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── GET handler (cron-compatible) ────────────────────────────────────────────
// GET triggers a full folder sync — can be called by Railway cron, external
// cron services, or the client-side auto-sync logic.

export async function GET() {
  try {
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!folderId) {
      return NextResponse.json(
        { error: 'GOOGLE_DRIVE_FOLDER_ID env var is not set' },
        { status: 500 },
      );
    }

    const range = 'Transition!A1:AQ';

    // Load team mappings and last-known modifiedTimes in parallel
    await ensureModifiedTimeColumn();
    const [teamMappings, lastModifiedTimes, sheets] = await Promise.all([
      loadTeamMappings(),
      loadLastModifiedTimes(),
      listSheetsInFolder(folderId),
    ]);
    console.log(`[transitions/sync] Loaded ${teamMappings.size} team mappings for auto-sync`);

    if (sheets.length === 0) {
      return NextResponse.json({
        workbooks: [],
        summary: { total_workbooks: 0, total_synced: 0, total_rows: 0, total_mapped: 0, skipped: 0, errors: 0 },
      });
    }

    const results: WorkbookResult[] = [];
    let skippedCount = 0;

    for (const sheet of sheets) {
      // Skip sheets that haven't been modified since last sync
      const lastKnown = lastModifiedTimes.get(sheet.id);
      if (lastKnown && sheet.modifiedTime && new Date(sheet.modifiedTime) <= new Date(lastKnown)) {
        console.log(`[transitions/sync] Skipping "${sheet.name}" (unchanged)`);
        results.push({
          sheetId: sheet.id, workbookName: sheet.name, detectedAdvisor: null,
          synced: 0, total: 0, mappedCount: 0, skipped: true,
        });
        skippedCount++;
        continue;
      }

      console.log(`[transitions/sync] Auto-syncing "${sheet.name}" (${sheet.id})…`);
      const result = await syncWorkbook(sheet.id, sheet.name, range, teamMappings);
      results.push(result);

      if (!result.error && sheet.modifiedTime) {
        await updateWorkbookModifiedTime(sheet.id, sheet.modifiedTime);
      }
    }

    const totalSynced = results.reduce((sum, r) => sum + r.synced, 0);
    const totalRows = results.reduce((sum, r) => sum + r.total, 0);
    const totalMapped = results.reduce((sum, r) => sum + r.mappedCount, 0);
    const errors = results.filter(r => r.error).length;

    return NextResponse.json({
      workbooks: results,
      summary: {
        total_workbooks: sheets.length,
        total_synced: totalSynced,
        total_rows: totalRows,
        total_mapped: totalMapped,
        skipped: skippedCount,
        errors,
      },
    });
  } catch (err) {
    console.error('[transitions/sync GET]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
