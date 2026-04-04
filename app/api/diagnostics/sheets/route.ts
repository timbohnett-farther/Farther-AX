/**
 * GET /api/diagnostics/sheets
 *
 * Diagnostic endpoint to inspect Google Sheets structure.
 * Shows tab names, headers, and how they map (or don't map) to transition fields.
 * No auth required — deploy, check, then remove.
 */
import { NextResponse } from 'next/server';
import { listSheetsInFolder, fetchSheetData, getSheetTabs } from '@/lib/google-sheets';

// ── Same header mapping logic from transitions-sync.ts ──────────────────────

interface TransitionRecord {
  farther_contact: string; advisor_name: string; custodian: string;
  document_readiness: string; status_of_iaa: string; status_of_account_paperwork: string;
  portal_status: string; household_name: string; billing_group: string;
  primary_first_name: string; primary_middle_name: string; primary_last_name: string;
  primary_email: string; primary_phone: string; primary_dob: string;
  primary_ssn_last4: string; primary_street: string; primary_city: string;
  primary_state: string; primary_zip: string; primary_country: string;
  secondary_first_name: string; secondary_middle_name: string; secondary_last_name: string;
  secondary_email: string; secondary_phone: string; secondary_dob: string;
  secondary_ssn_last4: string; secondary_street: string; secondary_city: string;
  secondary_state: string; secondary_zip: string; secondary_country: string;
  fee_schedule: string; billing_exceptions: string; billing_exception_explanation: string;
  contra_account_firm: string; contra_account_numbers: string; new_account_number: string;
  account_type: string; account_name: string; mailing_street: string;
  mailing_city: string; mailing_state: string; mailing_zip: string;
  mailing_country: string; portal_invites: string; welcome_gift_box: string;
  notes: string; billing_setup: string;
}

function resolveHeader(header: string, lcityCount: number): keyof TransitionRecord | null {
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

export async function GET() {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) {
    return NextResponse.json({ error: 'GOOGLE_DRIVE_FOLDER_ID not set' }, { status: 500 });
  }

  try {
    // 1. List all sheets in the folder
    const sheets = await listSheetsInFolder(folderId);

    const results = [];

    // 2. Inspect first 3 sheets (or fewer)
    for (const sheet of sheets.slice(0, 5)) {
      const sheetResult: Record<string, unknown> = {
        name: sheet.name,
        id: sheet.id,
        modifiedTime: sheet.modifiedTime,
      };

      try {
        // Get tab names
        const tabs = await getSheetTabs(sheet.id);
        sheetResult.tabs = tabs;

        const hasTransitionTab = tabs.some(t => t.toLowerCase() === 'transition');
        sheetResult.hasTransitionTab = hasTransitionTab;

        // Try to read headers from the Transition tab (or first tab)
        const targetTab = hasTransitionTab ? 'Transition' : tabs[0];
        sheetResult.readingTab = targetTab;

        try {
          const rows = await fetchSheetData(sheet.id, `${targetTab}!A1:AQ5`);
          const headerRow = rows[0] ?? [];
          sheetResult.headerCount = headerRow.length;
          sheetResult.rawHeaders = headerRow;
          sheetResult.dataRowCount = rows.length - 1;
          sheetResult.sampleDataRow = rows[1] ?? [];

          // Map headers
          let lcityCount = 0;
          const mapped: Record<string, string> = {};
          const unmapped: string[] = [];

          for (const h of headerRow) {
            const field = resolveHeader(h, lcityCount);
            if (field) {
              mapped[h] = field;
            } else if (h.trim()) {
              unmapped.push(h);
            }
            if (h === 'LCity') lcityCount++;
          }

          sheetResult.mappedHeaders = mapped;
          sheetResult.unmappedHeaders = unmapped;
          sheetResult.mappedCount = Object.keys(mapped).length;
          sheetResult.unmappedCount = unmapped.length;
          sheetResult.mappingRate = headerRow.filter(h => h.trim()).length > 0
            ? `${Math.round((Object.keys(mapped).length / headerRow.filter(h => h.trim()).length) * 100)}%`
            : '0%';

        } catch (fetchErr) {
          sheetResult.fetchError = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
        }
      } catch (tabErr) {
        sheetResult.tabError = tabErr instanceof Error ? tabErr.message : String(tabErr);
      }

      results.push(sheetResult);
    }

    return NextResponse.json({
      folderId,
      totalSheets: sheets.length,
      inspected: results.length,
      sheets: results,
    });
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
