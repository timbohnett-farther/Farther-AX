import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// ── Types ────────────────────────────────────────────────────────────────────

export interface ChangeEvent {
  id?: number;
  change_type: string;
  entity_type: string;
  entity_id: string | null;
  advisor_name: string | null;
  old_value: string | null;
  new_value: string | null;
  details: Record<string, unknown> | null;
  detected_at: string;
}

export interface ChangelogOptions {
  advisor?: string;
  changeType?: string;
  limit?: number;
  offset?: number;
}

// ── 1. Detect changes vs. latest snapshot ───────────────────────────────────

export async function detectChanges(): Promise<ChangeEvent[]> {
  // Get the latest snapshot
  const snapshotResult = await prisma.$queryRaw<Array<{
    id: number;
    snapshot_data: Record<
      string,
      { envelopes: Record<string, string>; households: string[] }
    >;
  }>>`
    SELECT id, snapshot_data
    FROM docusign_sync_snapshots
    WHERE snapshot_type = 'full'
    ORDER BY created_at DESC
    LIMIT 1
  `;

  if (snapshotResult.length === 0) {
    console.log('[change-detection] No previous snapshot found, skipping');
    return [];
  }

  const previousSnapshot = snapshotResult[0].snapshot_data;

  // Build current state
  const envelopesResult = await prisma.$queryRaw<Array<{
    envelope_id: string;
    status: string;
    matched_advisor_name: string | null;
  }>>`SELECT envelope_id, status, matched_advisor_name FROM docusign_envelopes`;

  const householdsResult = await prisma.$queryRaw<Array<{
    advisor_name: string;
    household_name: string;
  }>>`
    SELECT DISTINCT advisor_name, household_name
    FROM transition_clients
    WHERE advisor_name IS NOT NULL AND household_name IS NOT NULL
  `;

  // Build current advisor → { envelopes, households } map
  const currentState: Record<
    string,
    { envelopes: Record<string, string>; households: Set<string> }
  > = {};

  for (const env of envelopesResult) {
    const advisor = env.matched_advisor_name ?? '__unmatched__';
    if (!currentState[advisor]) {
      currentState[advisor] = { envelopes: {}, households: new Set() };
    }
    currentState[advisor].envelopes[env.envelope_id] = env.status;
  }

  for (const row of householdsResult) {
    const advisor = row.advisor_name;
    if (!currentState[advisor]) {
      currentState[advisor] = { envelopes: {}, households: new Set() };
    }
    currentState[advisor].households.add(row.household_name);
  }

  const changes: ChangeEvent[] = [];
  const now = new Date().toISOString();

  // Compare: look for changes in each advisor
  const allAdvisors = new Set([
    ...Object.keys(previousSnapshot),
    ...Object.keys(currentState),
  ]);

  for (const advisor of Array.from(allAdvisors)) {
    const prev = previousSnapshot[advisor];
    const curr = currentState[advisor];

    // New households
    const prevHouseholds = new Set(prev?.households ?? []);
    const currHouseholds = curr?.households ?? new Set<string>();

    for (const hh of Array.from(currHouseholds)) {
      if (!prevHouseholds.has(hh)) {
        changes.push({
          change_type: 'new_household',
          entity_type: 'household',
          entity_id: hh,
          advisor_name: advisor === '__unmatched__' ? null : advisor,
          old_value: null,
          new_value: hh,
          details: null,
          detected_at: now,
        });
      }
    }

    // Removed households
    for (const hh of Array.from(prevHouseholds)) {
      if (!currHouseholds.has(hh)) {
        changes.push({
          change_type: 'removed_household',
          entity_type: 'household',
          entity_id: hh,
          advisor_name: advisor === '__unmatched__' ? null : advisor,
          old_value: hh,
          new_value: null,
          details: null,
          detected_at: now,
        });
      }
    }

    // Envelope status changes
    const prevEnvelopes = prev?.envelopes ?? {};
    const currEnvelopes = curr?.envelopes ?? {};

    // New envelopes
    for (const [envId, status] of Object.entries(currEnvelopes)) {
      if (!(envId in prevEnvelopes)) {
        changes.push({
          change_type: 'new_envelope',
          entity_type: 'envelope',
          entity_id: envId,
          advisor_name: advisor === '__unmatched__' ? null : advisor,
          old_value: null,
          new_value: status,
          details: null,
          detected_at: now,
        });
      } else if (prevEnvelopes[envId] !== status) {
        changes.push({
          change_type: 'status_change',
          entity_type: 'envelope',
          entity_id: envId,
          advisor_name: advisor === '__unmatched__' ? null : advisor,
          old_value: prevEnvelopes[envId],
          new_value: status,
          details: null,
          detected_at: now,
        });
      }
    }
  }

  // Persist changes to docusign_change_log
  if (changes.length > 0) {
    await prisma.$transaction(async (tx) => {
      for (const change of changes) {
        await tx.$executeRaw`
          INSERT INTO docusign_change_log (
            change_type, entity_type, entity_id, advisor_name,
            old_value, new_value, details, detected_at
          ) VALUES (
            ${change.change_type},
            ${change.entity_type},
            ${change.entity_id},
            ${change.advisor_name},
            ${change.old_value},
            ${change.new_value},
            ${change.details ? JSON.stringify(change.details) : null}::jsonb,
            ${change.detected_at}
          )
        `;
      }
    });
  }

  console.log(`[change-detection] Detected ${changes.length} changes`);
  return changes;
}

// ── 2. Query changelog with filters ─────────────────────────────────────────

export async function getChangelog(
  opts: ChangelogOptions = {},
): Promise<{ changes: ChangeEvent[]; total: number }> {
  const { advisor, changeType, limit = 50, offset = 0 } = opts;

  const conditions: string[] = [];
  const params: (string | number)[] = [];
  let paramIndex = 1;

  if (advisor) {
    conditions.push(`advisor_name = $${paramIndex++}`);
    params.push(advisor);
  }
  if (changeType) {
    conditions.push(`change_type = $${paramIndex++}`);
    params.push(changeType);
  }

  // Build WHERE clause as raw SQL string (Prisma.raw)
  const whereClause =
    conditions.length > 0 ? Prisma.raw(` WHERE ${conditions.join(' AND ')}`) : Prisma.empty;

  // Get total count
  const countResult = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
    `SELECT COUNT(*) AS count FROM docusign_change_log${conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : ''}`,
    ...params,
  );
  const total = parseInt(countResult[0].count.toString(), 10);

  // Get paginated results
  const result = await prisma.$queryRawUnsafe<Array<{
    id: number;
    change_type: string;
    entity_type: string;
    entity_id: string | null;
    advisor_name: string | null;
    old_value: string | null;
    new_value: string | null;
    details: Record<string, unknown> | null;
    detected_at: Date;
  }>>(
    `SELECT id, change_type, entity_type, entity_id, advisor_name,
            old_value, new_value, details, detected_at
     FROM docusign_change_log
     ${conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''}
     ORDER BY detected_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    ...params, limit, offset,
  );

  const changes: ChangeEvent[] = result.map((row) => ({
    id: row.id,
    change_type: row.change_type,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    advisor_name: row.advisor_name,
    old_value: row.old_value,
    new_value: row.new_value,
    details: row.details,
    detected_at: row.detected_at.toISOString(),
  }));

  return { changes, total };
}
