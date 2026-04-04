import { NextRequest, NextResponse } from 'next/server';
import { listSheetsInFolder } from '@/lib/google-sheets';
import { prisma } from '@/lib/prisma';

// ── GET — List all workbooks in the Drive folder + their assignment status ────

export async function GET() {
  try {
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!folderId) {
      return NextResponse.json(
        { error: 'GOOGLE_DRIVE_FOLDER_ID env var is not set' },
        { status: 500 },
      );
    }

    // Fetch workbooks from Drive
    const driveFiles = await listSheetsInFolder(folderId);

    // Fetch existing mappings from DB
    const dbRows = await prisma.$queryRaw<Array<{
      sheet_id: string;
      workbook_name: string | null;
      detected_advisor_name: string | null;
      assigned_advisor_name: string | null;
      hubspot_contact_id: string | null;
      is_locked: boolean;
      last_synced_at: string | null;
    }>>`
      SELECT sheet_id, workbook_name, detected_advisor_name, assigned_advisor_name,
             hubspot_contact_id, is_locked, last_synced_at
      FROM transition_workbooks
    `;

    const dbMap = new Map(dbRows.map(r => [r.sheet_id, r]));

    // Merge Drive listing with DB state
    const workbooks = driveFiles.map(file => {
      const db = dbMap.get(file.id);
      return {
        sheet_id: file.id,
        workbook_name: file.name,
        sheet_url: `https://docs.google.com/spreadsheets/d/${file.id}`,
        modified_time: file.modifiedTime,
        detected_advisor_name: db?.detected_advisor_name ?? null,
        assigned_advisor_name: db?.assigned_advisor_name ?? null,
        hubspot_contact_id: db?.hubspot_contact_id ?? null,
        is_locked: db?.is_locked ?? false,
        last_synced_at: db?.last_synced_at ?? null,
      };
    });

    return NextResponse.json({ workbooks });
  } catch (err) {
    console.error('[transitions/workbooks GET]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── PATCH — Update a workbook's advisor assignment / lock status ──────────────

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { sheet_id, assigned_advisor_name, hubspot_contact_id, is_locked } = body as {
      sheet_id?: string;
      assigned_advisor_name?: string;
      hubspot_contact_id?: string;
      is_locked?: boolean;
    };

    if (!sheet_id) {
      return NextResponse.json({ error: 'sheet_id is required' }, { status: 400 });
    }

    // Upsert the workbook mapping
    const result = await prisma.$queryRaw<Array<any>>`
      INSERT INTO transition_workbooks (sheet_id, assigned_advisor_name, hubspot_contact_id, is_locked, updated_at)
      VALUES (${sheet_id}, ${assigned_advisor_name ?? null}, ${hubspot_contact_id ?? null}, ${is_locked ?? null}, NOW())
      ON CONFLICT (sheet_id) DO UPDATE SET
        assigned_advisor_name = COALESCE(${assigned_advisor_name ?? null}, transition_workbooks.assigned_advisor_name),
        hubspot_contact_id    = COALESCE(${hubspot_contact_id ?? null}, transition_workbooks.hubspot_contact_id),
        is_locked             = COALESCE(${is_locked ?? null}, transition_workbooks.is_locked),
        updated_at            = NOW()
      RETURNING *
    `;

    return NextResponse.json({ workbook: result[0] });
  } catch (err) {
    console.error('[transitions/workbooks PATCH]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
