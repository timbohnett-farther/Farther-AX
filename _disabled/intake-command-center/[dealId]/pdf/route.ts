import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { decrypt } from '@/lib/encryption';
import { generateIntakePDF } from '@/lib/pdf-generator';

// POST /api/command-center/intake/[dealId]/pdf — Generate PDF + attach to HubSpot
export async function POST(_req: NextRequest, { params }: { params: { dealId: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { dealId } = params;

    // Fetch completed intake form
    const rows = await prisma.$queryRaw<any[]>`
      SELECT id, token, advisor_name, advisor_email, form_data, contact_id, completed_at
      FROM intake_forms
      WHERE deal_id = ${dealId} AND status = 'completed'
      ORDER BY completed_at DESC LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No completed intake form for this deal' }, { status: 404 });
    }

    const form = rows[0];
    const formData = form.form_data;

    // Decrypt SSN for PDF generation
    if (formData.q4_ssn) {
      try {
        formData.q4_ssn = decrypt(formData.q4_ssn);
      } catch {
        formData.q4_ssn = '***-**-****';
      }
    }

    // Generate PDF
    const pdfBuffer = await generateIntakePDF(formData, {
      advisorName: form.advisor_name,
      completedAt: form.completed_at,
    });

    const pdfUint8 = new Uint8Array(pdfBuffer);

    const hubspotToken = process.env.HUBSPOT_ACCESS_TOKEN;
    if (!hubspotToken) {
      // Return PDF as download if no HubSpot token
      return new NextResponse(pdfUint8, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="U4_2B_Intake_${form.advisor_name?.replace(/\s+/g, '_') || dealId}.pdf"`,
        },
      });
    }

    // Upload PDF to HubSpot Files
    const formDataUpload = new FormData();
    const blob = new Blob([pdfUint8], { type: 'application/pdf' });
    const fileName = `U4_2B_Intake_${form.advisor_name?.replace(/\s+/g, '_') || dealId}_${new Date().toISOString().slice(0, 10)}.pdf`;
    formDataUpload.append('file', blob, fileName);
    formDataUpload.append('options', JSON.stringify({
      access: 'PRIVATE',
      overwrite: false,
    }));
    formDataUpload.append('folderId', '0');

    const uploadRes = await fetch('https://api.hubapi.com/files/v3/files', {
      method: 'POST',
      headers: { Authorization: `Bearer ${hubspotToken}` },
      body: formDataUpload,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      console.error('HubSpot file upload failed:', err);
      // Still return the PDF as download
      return new NextResponse(pdfUint8, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    }

    const uploadData = await uploadRes.json();
    const fileId = uploadData.id;
    const fileUrl = uploadData.url;

    // Create note with attachment on the deal
    const noteRes = await fetch('https://api.hubapi.com/crm/v3/objects/notes', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${hubspotToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          hs_timestamp: new Date().toISOString(),
          hs_note_body: `U4 & 2B Intake Form completed by ${form.advisor_name || 'advisor'} on ${new Date(form.completed_at).toLocaleDateString()}. PDF attached.`,
          hs_attachment_ids: String(fileId),
        },
        associations: [
          {
            to: { id: dealId },
            types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 214 }],
          },
          ...(form.contact_id ? [{
            to: { id: form.contact_id },
            types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 202 }],
          }] : []),
        ],
      }),
    });

    let noteId = null;
    if (noteRes.ok) {
      const noteData = await noteRes.json();
      noteId = noteData.id;
    }

    // Update intake_forms record
    await prisma.$executeRaw`
      UPDATE intake_forms
      SET pdf_url = ${fileUrl || null},
          hubspot_note_id = ${noteId || null},
          updated_at = NOW()
      WHERE deal_id = ${dealId} AND status = 'completed'
    `;

    return NextResponse.json({
      success: true,
      pdfUrl: fileUrl,
      hubspotNoteId: noteId,
      fileName,
    });
  } catch (error: any) {
    console.error('Intake PDF error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
