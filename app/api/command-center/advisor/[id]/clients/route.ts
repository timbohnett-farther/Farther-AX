import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getStoredToken, fetchEnvelopes, type DocuSignEnvelope } from '@/lib/docusign';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await params; // consume params to satisfy Next.js route contract
    const dealName = req.nextUrl.searchParams.get('dealName') ?? '';

    if (!dealName) {
      return NextResponse.json(
        { error: 'dealName query param required' },
        { status: 400 },
      );
    }

    // ── 1. Query transition_clients matched to this advisor ────────────────
    const clientsResult = await pool.query(
      `SELECT *
       FROM transition_clients
       WHERE LOWER(advisor_name) = LOWER($1)
          OR LOWER($1) LIKE '%' || LOWER(advisor_name) || '%'
       ORDER BY household_name, id`,
      [dealName],
    );

    const clients = clientsResult.rows;

    // ── 2. Attempt DocuSign envelope enrichment ────────────────────────────
    let docusignConnected = false;
    const envelopesByEmail = new Map<string, DocuSignEnvelope[]>();

    const stored = await getStoredToken();
    if (stored) {
      const now = new Date();
      const expiresAt = new Date(stored.expires_at);
      if (expiresAt.getTime() - now.getTime() > 60_000) {
        try {
          const envelopes = await fetchEnvelopes(stored.access_token, 90);
          docusignConnected = true;

          // Build lookup: email → envelopes where that email is a signer
          for (const env of envelopes) {
            for (const signer of env.signers) {
              const email = signer.email.toLowerCase();
              if (!envelopesByEmail.has(email)) {
                envelopesByEmail.set(email, []);
              }
              envelopesByEmail.get(email)!.push(env);
            }
          }
        } catch (err) {
          console.warn('[clients] DocuSign fetch failed, continuing without:', err);
        }
      }
    }

    // ── 3. Merge clients with envelope data ────────────────────────────────
    let iaaSigned = 0;
    let paperworkComplete = 0;
    let pending = 0;

    const enrichedClients = clients.map((client) => {
      const email = (client.primary_email ?? '').toLowerCase();
      const matchedEnvelopes = email ? (envelopesByEmail.get(email) ?? []) : [];

      // Deduplicate envelopes by envelopeId
      const seen = new Set<string>();
      const uniqueEnvelopes = matchedEnvelopes.filter((e) => {
        if (seen.has(e.envelopeId)) return false;
        seen.add(e.envelopeId);
        return true;
      });

      // Count statuses
      const iaaStatus = (client.status_of_iaa ?? '').toLowerCase();
      const docusignIaaStatus = (client.docusign_iaa_status ?? '').toLowerCase();
      if (
        iaaStatus.includes('signed') ||
        iaaStatus.includes('complete') ||
        docusignIaaStatus === 'completed'
      ) {
        iaaSigned++;
      }

      const papStatus = (client.status_of_account_paperwork ?? '').toLowerCase();
      if (papStatus.includes('complete') || papStatus.includes('signed')) {
        paperworkComplete++;
      }

      if (
        !iaaStatus.includes('signed') &&
        !iaaStatus.includes('complete') &&
        docusignIaaStatus !== 'completed'
      ) {
        pending++;
      }

      return {
        ...client,
        envelopes: uniqueEnvelopes,
      };
    });

    // ── 4. Return merged response ──────────────────────────────────────────
    return NextResponse.json({
      advisor_name: dealName,
      docusign_connected: docusignConnected,
      summary: {
        total_accounts: clients.length,
        iaa_signed: iaaSigned,
        paperwork_complete: paperworkComplete,
        pending,
      },
      clients: enrichedClients,
    });
  } catch (err) {
    console.error('[advisor clients GET]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
