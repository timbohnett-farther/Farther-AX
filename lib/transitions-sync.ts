import { prisma } from '@/lib/prisma';
import { fetchSheetData, listSheetsInFolder } from '@/lib/google-sheets';

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

// ── Team Mappings ─────────────────────────────────────────────────────────────

async function loadTeamMappings(): Promise<Map<string, string>> {
  const mappings = await prisma.advisorTeamMapping.findMany();

  const map = new Map<string, string>();
  for (const mapping of mappings) {
    map.set(mapping.individual_name.trim(), mapping.team_name.trim());
  }

  console.log(`[transitions-sync] Loaded ${map.size} team mappings`);
  return map;
}

function applyTeamMapping(advisorName: string | null, mappings: Map<string, string>): string | null {
  if (!advisorName) return null;

  const trimmed = advisorName.trim();
  if (!trimmed) return null;

  const teamName = mappings.get(trimmed);
  if (teamName) {
    console.log(`[transitions-sync] Mapped "${trimmed}" → "${teamName}"`);
    return teamName;
  }

  return trimmed;
}

// ── DocuSign Status Checking ──────────────────────────────────────────────────

interface DocuSignEnvelopeStatus {
  envelopeId: string;
  status: string; // 'sent', 'delivered', 'completed', 'declined', 'voided'
}

/**
 * Fetch DocuSign envelope status for a given envelope ID
 */
async function fetchDocuSignStatus(envelopeId: string): Promise<string | null> {
  try {
    const accessToken = process.env.DOCUSIGN_ACCESS_TOKEN;
    const accountId = process.env.DOCUSIGN_ACCOUNT_ID;

    if (!accessToken || !accountId) {
      console.warn('[transitions-sync] DocuSign credentials not configured');
      return null;
    }

    const response = await fetch(
      `https://demo.docusign.net/restapi/v2.1/accounts/${accountId}/envelopes/${envelopeId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Envelope not found
      }
      console.error(`[transitions-sync] DocuSign API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.status || null;
  } catch (error) {
    console.error('[transitions-sync] DocuSign fetch error:', error);
    return null;
  }
}

/**
 * Update DocuSign statuses for all transition clients with envelope IDs
 */
async function syncDocuSignStatuses(): Promise<{ updated: number; failed: number }> {
  console.log('[transitions-sync] Syncing DocuSign statuses...');

  const clients = await prisma.transitionClient.findMany({
    where: {
      OR: [
        { docusign_iaa_envelope_id: { not: null } },
        { docusign_paperwork_envelope_id: { not: null } },
      ],
    },
    select: {
      id: true,
      docusign_iaa_envelope_id: true,
      docusign_paperwork_envelope_id: true,
      docusign_iaa_status: true,
      docusign_paperwork_status: true,
    },
  });

  let updated = 0;
  let failed = 0;

  for (const client of clients) {
    try {
      const updates: { docusign_iaa_status?: string; docusign_paperwork_status?: string } = {};

      // Check IAA envelope status
      if (client.docusign_iaa_envelope_id) {
        const status = await fetchDocuSignStatus(client.docusign_iaa_envelope_id);
        if (status && status !== client.docusign_iaa_status) {
          updates.docusign_iaa_status = status;
        }
      }

      // Check Paperwork envelope status
      if (client.docusign_paperwork_envelope_id) {
        const status = await fetchDocuSignStatus(client.docusign_paperwork_envelope_id);
        if (status && status !== client.docusign_paperwork_status) {
          updates.docusign_paperwork_status = status;
        }
      }

      // Update if there are changes
      if (Object.keys(updates).length > 0) {
        await prisma.transitionClient.update({
          where: { id: client.id },
          data: updates,
        });
        updated++;
      }
    } catch (error) {
      console.error(`[transitions-sync] Failed to update client ${client.id}:`, error);
      failed++;
    }
  }

  console.log(`[transitions-sync] DocuSign sync complete: ${updated} updated, ${failed} failed`);
  return { updated, failed };
}

// ── Workbook Sync ─────────────────────────────────────────────────────────────

interface WorkbookSyncResult {
  sheetId: string;
  workbookName: string;
  detectedAdvisor: string | null;
  synced: number;
  total: number;
  mappedCount: number;
  skipped?: boolean;
  error?: string;
}

async function syncWorkbook(
  sheetId: string,
  workbookName: string,
  range: string,
  teamMappings: Map<string, string>,
): Promise<WorkbookSyncResult> {
  try {
    const allRows = await fetchSheetData(sheetId, range);

    if (allRows.length < 2) {
      return { sheetId, workbookName, detectedAdvisor: null, synced: 0, total: 0, mappedCount: 0 };
    }

    const headers = allRows[0];
    const dataRows = allRows.slice(1);
    const fieldIndex = buildFieldIndex(headers);

    // Detect advisor name from first non-empty row
    const advisorColIdx = fieldIndex.get('advisor_name');
    let detectedAdvisor: string | null = null;
    if (advisorColIdx !== undefined) {
      for (const row of dataRows) {
        const val = (row[advisorColIdx] ?? '').trim();
        if (val) {
          detectedAdvisor = applyTeamMapping(val, teamMappings);
          break;
        }
      }
    }

    // Upsert workbook metadata
    const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}`;
    await prisma.transitionWorkbook.upsert({
      where: { sheet_id: sheetId },
      update: {
        workbook_name: workbookName,
        sheet_url: sheetUrl,
        detected_advisor_name: detectedAdvisor,
        last_synced_at: new Date(),
      },
      create: {
        sheet_id: sheetId,
        workbook_name: workbookName,
        sheet_url: sheetUrl,
        detected_advisor_name: detectedAdvisor,
      },
    });

    let synced = 0;
    let mappedCount = 0;

    for (let i = 0; i < dataRows.length; i++) {
      const cells = dataRows[i];
      if (cells.every(c => !c.trim())) continue;

      const record = parseRow(cells, fieldIndex);
      const sheetRowIndex = i + 1;

      // Apply team mapping
      const originalAdvisorName = record.advisor_name ?? null;
      const mappedAdvisorName = applyTeamMapping(originalAdvisorName, teamMappings);

      if (mappedAdvisorName !== originalAdvisorName && mappedAdvisorName !== null) {
        mappedCount++;
      }

      record.advisor_name = mappedAdvisorName ?? record.advisor_name;

      // Upsert transition client
      await prisma.transitionClient.upsert({
        where: {
          sheet_id_sheet_row_index: {
            sheet_id: sheetId,
            sheet_row_index: sheetRowIndex,
          },
        },
        update: {
          workbook_name,
          farther_contact: record.farther_contact || null,
          advisor_name: record.advisor_name || null,
          custodian: record.custodian || null,
          document_readiness: record.document_readiness || null,
          status_of_iaa: record.status_of_iaa || null,
          status_of_account_paperwork: record.status_of_account_paperwork || null,
          portal_status: record.portal_status || null,
          household_name: record.household_name || null,
          billing_group: record.billing_group || null,
          primary_first_name: record.primary_first_name || null,
          primary_middle_name: record.primary_middle_name || null,
          primary_last_name: record.primary_last_name || null,
          primary_email: record.primary_email || null,
          primary_phone: record.primary_phone || null,
          primary_dob: record.primary_dob || null,
          primary_ssn_last4: record.primary_ssn_last4 || null,
          primary_street: record.primary_street || null,
          primary_city: record.primary_city || null,
          primary_state: record.primary_state || null,
          primary_zip: record.primary_zip || null,
          primary_country: record.primary_country || null,
          secondary_first_name: record.secondary_first_name || null,
          secondary_middle_name: record.secondary_middle_name || null,
          secondary_last_name: record.secondary_last_name || null,
          secondary_email: record.secondary_email || null,
          secondary_phone: record.secondary_phone || null,
          secondary_dob: record.secondary_dob || null,
          secondary_ssn_last4: record.secondary_ssn_last4 || null,
          secondary_street: record.secondary_street || null,
          secondary_city: record.secondary_city || null,
          secondary_state: record.secondary_state || null,
          secondary_zip: record.secondary_zip || null,
          secondary_country: record.secondary_country || null,
          fee_schedule: record.fee_schedule || null,
          billing_exceptions: record.billing_exceptions || null,
          billing_exception_explanation: record.billing_exception_explanation || null,
          contra_account_firm: record.contra_account_firm || null,
          contra_account_numbers: record.contra_account_numbers || null,
          new_account_number: record.new_account_number || null,
          account_type: record.account_type || null,
          account_name: record.account_name || null,
          mailing_street: record.mailing_street || null,
          mailing_city: record.mailing_city || null,
          mailing_state: record.mailing_state || null,
          mailing_zip: record.mailing_zip || null,
          mailing_country: record.mailing_country || null,
          portal_invites: record.portal_invites || null,
          welcome_gift_box: record.welcome_gift_box || null,
          notes: record.notes || null,
          billing_setup: record.billing_setup || null,
          synced_at: new Date(),
        },
        create: {
          sheet_id: sheetId,
          sheet_row_index: sheetRowIndex,
          workbook_name,
          farther_contact: record.farther_contact || null,
          advisor_name: record.advisor_name || null,
          custodian: record.custodian || null,
          document_readiness: record.document_readiness || null,
          status_of_iaa: record.status_of_iaa || null,
          status_of_account_paperwork: record.status_of_account_paperwork || null,
          portal_status: record.portal_status || null,
          household_name: record.household_name || null,
          billing_group: record.billing_group || null,
          primary_first_name: record.primary_first_name || null,
          primary_middle_name: record.primary_middle_name || null,
          primary_last_name: record.primary_last_name || null,
          primary_email: record.primary_email || null,
          primary_phone: record.primary_phone || null,
          primary_dob: record.primary_dob || null,
          primary_ssn_last4: record.primary_ssn_last4 || null,
          primary_street: record.primary_street || null,
          primary_city: record.primary_city || null,
          primary_state: record.primary_state || null,
          primary_zip: record.primary_zip || null,
          primary_country: record.primary_country || null,
          secondary_first_name: record.secondary_first_name || null,
          secondary_middle_name: record.secondary_middle_name || null,
          secondary_last_name: record.secondary_last_name || null,
          secondary_email: record.secondary_email || null,
          secondary_phone: record.secondary_phone || null,
          secondary_dob: record.secondary_dob || null,
          secondary_ssn_last4: record.secondary_ssn_last4 || null,
          secondary_street: record.secondary_street || null,
          secondary_city: record.secondary_city || null,
          secondary_state: record.secondary_state || null,
          secondary_zip: record.secondary_zip || null,
          secondary_country: record.secondary_country || null,
          fee_schedule: record.fee_schedule || null,
          billing_exceptions: record.billing_exceptions || null,
          billing_exception_explanation: record.billing_exception_explanation || null,
          contra_account_firm: record.contra_account_firm || null,
          contra_account_numbers: record.contra_account_numbers || null,
          new_account_number: record.new_account_number || null,
          account_type: record.account_type || null,
          account_name: record.account_name || null,
          mailing_street: record.mailing_street || null,
          mailing_city: record.mailing_city || null,
          mailing_state: record.mailing_state || null,
          mailing_zip: record.mailing_zip || null,
          mailing_country: record.mailing_country || null,
          portal_invites: record.portal_invites || null,
          welcome_gift_box: record.welcome_gift_box || null,
          notes: record.notes || null,
          billing_setup: record.billing_setup || null,
        },
      });

      synced += 1;
    }

    return { sheetId, workbookName, detectedAdvisor, synced, total: dataRows.length, mappedCount };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[transitions-sync] Error syncing "${workbookName}" (${sheetId}):`, message);
    return { sheetId, workbookName, detectedAdvisor: null, synced: 0, total: 0, mappedCount: 0, error: message };
  }
}

// ── Main Sync Function ────────────────────────────────────────────────────────

export interface TransitionsSyncResult {
  workbooks: WorkbookSyncResult[];
  docusign: { updated: number; failed: number };
  summary: {
    total_workbooks: number;
    total_synced: number;
    total_rows: number;
    total_mapped: number;
    skipped: number;
    errors: number;
  };
}

/**
 * Sync all transition workbooks from Google Drive folder
 * with incremental sync (skip unchanged sheets)
 */
export async function syncAllTransitions(): Promise<TransitionsSyncResult> {
  const startTime = Date.now();
  console.log('[transitions-sync] Starting full transitions sync...');

  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) {
    throw new Error('GOOGLE_DRIVE_FOLDER_ID not configured');
  }

  try {
    // Load team mappings
    const teamMappings = await loadTeamMappings();

    // Fetch all sheets in folder with modified times
    const sheets = await listSheetsInFolder(folderId);

    // Load last known modified times from database
    const workbooks = await prisma.transitionWorkbook.findMany({
      select: {
        sheet_id: true,
        drive_modified_time: true,
      },
    });

    const lastModifiedTimes = new Map<string, Date | null>();
    for (const wb of workbooks) {
      lastModifiedTimes.set(wb.sheet_id, wb.drive_modified_time);
    }

    const results: WorkbookSyncResult[] = [];
    let skippedCount = 0;
    const range = 'Transition!A1:AQ';

    // Sync each workbook
    for (const sheet of sheets) {
      const lastKnown = lastModifiedTimes.get(sheet.id);

      // Skip if unchanged since last sync
      if (lastKnown && sheet.modifiedTime && new Date(sheet.modifiedTime) <= lastKnown) {
        console.log(`[transitions-sync] Skipping "${sheet.name}" (unchanged since ${lastKnown.toISOString()})`);
        results.push({
          sheetId: sheet.id,
          workbookName: sheet.name,
          detectedAdvisor: null,
          synced: 0,
          total: 0,
          mappedCount: 0,
          skipped: true,
        });
        skippedCount++;
        continue;
      }

      console.log(`[transitions-sync] Syncing "${sheet.name}" (${sheet.id})...`);
      const result = await syncWorkbook(sheet.id, sheet.name, range, teamMappings);
      results.push(result);

      // Update modified time after successful sync
      if (!result.error && sheet.modifiedTime) {
        await prisma.transitionWorkbook.update({
          where: { sheet_id: sheet.id },
          data: { drive_modified_time: new Date(sheet.modifiedTime) },
        });
      }
    }

    // Sync DocuSign statuses for all clients
    const docusignResult = await syncDocuSignStatuses();

    const totalSynced = results.reduce((sum, r) => sum + r.synced, 0);
    const totalRows = results.reduce((sum, r) => sum + r.total, 0);
    const totalMapped = results.reduce((sum, r) => sum + r.mappedCount, 0);
    const errors = results.filter(r => r.error).length;

    const duration = Date.now() - startTime;

    console.log(
      `[transitions-sync] ✓ Sync complete: ${totalSynced} records synced, ${skippedCount} skipped, ${errors} errors in ${duration}ms`
    );

    return {
      workbooks: results,
      docusign: docusignResult,
      summary: {
        total_workbooks: sheets.length,
        total_synced: totalSynced,
        total_rows: totalRows,
        total_mapped: totalMapped,
        skipped: skippedCount,
        errors,
      },
    };
  } catch (error) {
    console.error('[transitions-sync] Sync failed:', error);
    throw error;
  }
}

/**
 * Sync a single workbook by sheet ID
 */
export async function syncSingleWorkbook(sheetId: string): Promise<WorkbookSyncResult> {
  console.log(`[transitions-sync] Syncing single workbook: ${sheetId}`);

  const teamMappings = await loadTeamMappings();
  const range = 'Transition!A1:AQ';

  const result = await syncWorkbook(sheetId, '', range, teamMappings);

  console.log(`[transitions-sync] ✓ Synced workbook ${sheetId}: ${result.synced} records`);

  return result;
}
