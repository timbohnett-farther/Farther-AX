import { getValidToken, DocuSignEnvelope, DocuSignSigner } from '@/lib/docusign';
import pool from '@/lib/db';

const BASE_URI = process.env.DOCUSIGN_BASE_URI ?? 'https://demo.docusign.net';
const API_ACCOUNT_ID = process.env.DOCUSIGN_API_ACCOUNT_ID ?? '';

// ── Types ────────────────────────────────────────────────────────────────────

export interface SyncResult {
  totalFetched: number;
  upsertedEnvelopes: number;
  upsertedSigners: number;
  matchedCount: number;
  unmatchedCount: number;
  snapshotId: number | null;
}

// ── 1. Paginated fetch from DocuSign API ────────────────────────────────────

export async function fetchAllEnvelopes(
  accessToken: string,
  fromDays: number = 180,
): Promise<DocuSignEnvelope[]> {
  const fromDate = new Date(
    Date.now() - fromDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  const params = new URLSearchParams({
    from_date: fromDate,
    status: 'any',
    include: 'recipients',
    count: '100',
  });

  let url: string | null =
    `${BASE_URI}/restapi/v2.1/accounts/${API_ACCOUNT_ID}/envelopes?${params.toString()}`;

  const allEnvelopes: DocuSignEnvelope[] = [];

  while (url) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[docusign-sync] fetchAllEnvelopes error:', res.status, errText);
      if (res.status === 401) throw new Error('DOCUSIGN_AUTH_EXPIRED');
      throw new Error(`DocuSign API error ${res.status}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();

    for (const env of data.envelopes ?? []) {
      const signers: DocuSignSigner[] = (env.recipients?.signers ?? []).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (s: any) => ({
          name: s.name ?? '',
          email: (s.email ?? '').toLowerCase(),
          status: s.status ?? '',
          signedDateTime: s.signedDateTime,
          deliveredDateTime: s.deliveredDateTime,
          sentDateTime: s.sentDateTime,
        }),
      );

      allEnvelopes.push({
        envelopeId: env.envelopeId,
        status: env.status,
        emailSubject: env.emailSubject ?? '',
        sentDateTime: env.sentDateTime,
        completedDateTime: env.completedDateTime,
        statusChangedDateTime: env.statusChangedDateTime,
        signers,
      });
    }

    // Follow pagination
    if (data.nextUri) {
      // nextUri is relative, e.g. /restapi/v2.1/accounts/.../envelopes?...
      url = `${BASE_URI}${data.nextUri}`;
    } else {
      url = null;
    }
  }

  console.log(`[docusign-sync] Fetched ${allEnvelopes.length} envelopes total`);
  return allEnvelopes;
}

// ── 2. Upsert envelopes + signers to DB (batch 50) ─────────────────────────

export async function syncEnvelopesToDb(
  envelopes: DocuSignEnvelope[],
): Promise<{ upsertedEnvelopes: number; upsertedSigners: number }> {
  let upsertedEnvelopes = 0;
  let upsertedSigners = 0;

  const BATCH_SIZE = 50;

  for (let i = 0; i < envelopes.length; i += BATCH_SIZE) {
    const batch = envelopes.slice(i, i + BATCH_SIZE);
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      for (const env of batch) {
        // Classify envelope type
        const envelopeType = env.emailSubject.toLowerCase().includes('iaa')
          ? 'iaa'
          : 'paperwork';

        // Upsert envelope
        await client.query(
          `INSERT INTO docusign_envelopes (
            envelope_id, status, email_subject, sent_date_time,
            completed_date_time, status_changed_at, envelope_type,
            raw_json, last_synced_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
          ON CONFLICT (envelope_id) DO UPDATE SET
            status = EXCLUDED.status,
            email_subject = EXCLUDED.email_subject,
            sent_date_time = EXCLUDED.sent_date_time,
            completed_date_time = EXCLUDED.completed_date_time,
            status_changed_at = EXCLUDED.status_changed_at,
            envelope_type = EXCLUDED.envelope_type,
            raw_json = EXCLUDED.raw_json,
            last_synced_at = NOW(),
            updated_at = NOW()`,
          [
            env.envelopeId,
            env.status,
            env.emailSubject,
            env.sentDateTime ?? null,
            env.completedDateTime ?? null,
            env.statusChangedDateTime ?? null,
            envelopeType,
            JSON.stringify(env),
          ],
        );
        upsertedEnvelopes++;

        // Upsert signers: delete + re-insert for this envelope
        await client.query(
          `DELETE FROM docusign_signers WHERE envelope_id = $1`,
          [env.envelopeId],
        );

        for (const signer of env.signers) {
          await client.query(
            `INSERT INTO docusign_signers (
              envelope_id, signer_name, signer_email, status,
              signed_date_time, delivered_date_time, sent_date_time
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              env.envelopeId,
              signer.name,
              signer.email,
              signer.status,
              signer.signedDateTime ?? null,
              signer.deliveredDateTime ?? null,
              signer.sentDateTime ?? null,
            ],
          );
          upsertedSigners++;
        }
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  console.log(
    `[docusign-sync] Upserted ${upsertedEnvelopes} envelopes, ${upsertedSigners} signers`,
  );
  return { upsertedEnvelopes, upsertedSigners };
}

// ── 3. Match and classify unmatched envelopes ───────────────────────────────

export async function matchAndClassify(): Promise<{
  matchedCount: number;
  unmatchedCount: number;
}> {
  // Get all unmatched envelopes
  const unmatchedResult = await pool.query<{
    envelope_id: string;
    email_subject: string;
  }>(
    `SELECT envelope_id, email_subject
     FROM docusign_envelopes
     WHERE matched_advisor_name IS NULL`,
  );

  if (unmatchedResult.rows.length === 0) {
    return { matchedCount: 0, unmatchedCount: 0 };
  }

  // Build advisor email map from transition_clients
  const clientsResult = await pool.query<{
    advisor_name: string;
    primary_email: string | null;
    secondary_email: string | null;
  }>(
    `SELECT DISTINCT advisor_name, primary_email, secondary_email
     FROM transition_clients
     WHERE primary_email IS NOT NULL`,
  );

  const advisorEmails = new Map<string, Set<string>>();
  const advisorNames: string[] = [];

  for (const row of clientsResult.rows) {
    const name = row.advisor_name;
    if (!advisorEmails.has(name)) {
      advisorEmails.set(name, new Set());
      advisorNames.push(name);
    }
    const emailSet = advisorEmails.get(name)!;
    if (row.primary_email) emailSet.add(row.primary_email.toLowerCase());
    if (row.secondary_email) emailSet.add(row.secondary_email.toLowerCase());
  }

  let matchedCount = 0;
  let unmatchedCount = 0;

  for (const row of unmatchedResult.rows) {
    // Get signers for this envelope
    const signersResult = await pool.query<{ signer_email: string }>(
      `SELECT signer_email FROM docusign_signers WHERE envelope_id = $1`,
      [row.envelope_id],
    );
    const signerEmails = signersResult.rows.map((s) => s.signer_email.toLowerCase());

    let matchedAdvisor: string | null = null;
    let matchMethod: string | null = null;

    // Strategy 1: Email match
    for (const [advisorName, emails] of Array.from(advisorEmails.entries())) {
      if (signerEmails.some((se) => emails.has(se))) {
        matchedAdvisor = advisorName;
        matchMethod = 'email';
        break;
      }
    }

    // Strategy 2: Subject match (full name)
    if (!matchedAdvisor) {
      const subjectLower = (row.email_subject ?? '').toLowerCase();
      for (const advisorName of advisorNames) {
        if (subjectLower.includes(advisorName.toLowerCase())) {
          matchedAdvisor = advisorName;
          matchMethod = 'subject';
          break;
        }
      }
    }

    // Strategy 3: Subject match (last name)
    if (!matchedAdvisor) {
      const subjectLower = (row.email_subject ?? '').toLowerCase();
      for (const advisorName of advisorNames) {
        const parts = advisorName.split(' ');
        if (parts.length > 1) {
          const lastName = parts[parts.length - 1].toLowerCase();
          if (lastName.length > 2 && subjectLower.includes(lastName)) {
            matchedAdvisor = advisorName;
            matchMethod = 'household_name';
            break;
          }
        }
      }
    }

    if (matchedAdvisor && matchMethod) {
      await pool.query(
        `UPDATE docusign_envelopes
         SET matched_advisor_name = $1, match_method = $2, updated_at = NOW()
         WHERE envelope_id = $3`,
        [matchedAdvisor, matchMethod, row.envelope_id],
      );
      matchedCount++;
    } else {
      unmatchedCount++;
    }
  }

  console.log(
    `[docusign-sync] matchAndClassify: ${matchedCount} matched, ${unmatchedCount} unmatched`,
  );
  return { matchedCount, unmatchedCount };
}

// ── 4. Save JSONB snapshot ──────────────────────────────────────────────────

export async function saveSnapshot(): Promise<number | null> {
  // Build snapshot: advisor → { envelopes, households }
  const envelopesResult = await pool.query<{
    envelope_id: string;
    status: string;
    matched_advisor_name: string | null;
  }>(
    `SELECT envelope_id, status, matched_advisor_name FROM docusign_envelopes`,
  );

  const householdsResult = await pool.query<{
    advisor_name: string;
    household_name: string;
  }>(
    `SELECT DISTINCT advisor_name, household_name
     FROM transition_clients
     WHERE advisor_name IS NOT NULL AND household_name IS NOT NULL`,
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const snapshotData: Record<string, any> = {};
  const advisorSet = new Set<string>();

  for (const env of envelopesResult.rows) {
    const advisor = env.matched_advisor_name ?? '__unmatched__';
    advisorSet.add(advisor);
    if (!snapshotData[advisor]) {
      snapshotData[advisor] = { envelopes: {}, households: new Set<string>() };
    }
    snapshotData[advisor].envelopes[env.envelope_id] = env.status;
  }

  for (const row of householdsResult.rows) {
    const advisor = row.advisor_name;
    if (!snapshotData[advisor]) {
      snapshotData[advisor] = { envelopes: {}, households: new Set<string>() };
    }
    snapshotData[advisor].households.add(row.household_name);
    advisorSet.add(advisor);
  }

  // Convert Sets to arrays for JSON serialization
  const serializable: Record<string, { envelopes: Record<string, string>; households: string[] }> = {};
  for (const [advisor, data] of Array.from(Object.entries(snapshotData))) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = data as any;
    serializable[advisor] = {
      envelopes: d.envelopes,
      households: Array.from(d.households as Set<string>),
    };
  }

  const householdCount = householdsResult.rows.length;

  const result = await pool.query<{ id: number }>(
    `INSERT INTO docusign_sync_snapshots (
      snapshot_type, snapshot_data, advisor_count, envelope_count, household_count
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING id`,
    [
      'full',
      JSON.stringify(serializable),
      advisorSet.size,
      envelopesResult.rows.length,
      householdCount,
    ],
  );

  const snapshotId = result.rows[0]?.id ?? null;
  console.log(`[docusign-sync] Saved snapshot #${snapshotId}`);
  return snapshotId;
}

// ── 5. Full sync orchestrator ───────────────────────────────────────────────

export async function runFullSync(
  fromDays: number = 180,
): Promise<SyncResult> {
  // Step 1: Get valid token
  const accessToken = await getValidToken();
  if (!accessToken) {
    throw new Error('No valid DocuSign access token available');
  }

  // Step 2: Fetch all envelopes (paginated)
  const envelopes = await fetchAllEnvelopes(accessToken, fromDays);

  // Step 3: Upsert to DB
  const { upsertedEnvelopes, upsertedSigners } =
    await syncEnvelopesToDb(envelopes);

  // Step 4: Match and classify
  const { matchedCount, unmatchedCount } = await matchAndClassify();

  // Step 5: Save snapshot
  const snapshotId = await saveSnapshot();

  return {
    totalFetched: envelopes.length,
    upsertedEnvelopes,
    upsertedSigners,
    matchedCount,
    unmatchedCount,
    snapshotId,
  };
}
