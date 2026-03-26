/**
 * Advisor Data Store — Persistent DB-backed cache with incremental sync
 *
 * Strategy:
 *   1. First visit: Fetch everything from HubSpot, write to DB, serve
 *   2. Return visits: Serve from DB instantly
 *   3. Background: Silently fetch only NEW activities (notes, calls, emails)
 *      since last sync, plus deal stage updates. Compare & upsert changes.
 *
 * Tables:
 *   - advisor_profiles: Static CRM data (deal, contacts, team, pinned note)
 *   - advisor_activities: Timestamped activities (notes, calls, emails, meetings)
 */

import pool from '@/lib/db';

// ── Types ────────────────────────────────────────────────────────────────────

export interface StoredAdvisorProfile {
  deal_id: string;
  deal_properties: Record<string, unknown>;
  contacts: unknown[];
  team: Record<string, unknown> | null;
  pinned_note: unknown | null;
  last_synced_at: string;
  created_at: string;
}

export interface StoredActivity {
  id: number;
  deal_id: string;
  activity_type: 'note' | 'email' | 'call' | 'meeting';
  hubspot_id: string;
  activity_timestamp: string;
  properties: Record<string, unknown>;
  created_at: string;
}

export interface AdvisorSnapshot {
  profile: StoredAdvisorProfile | null;
  activities: StoredActivity[];
  fromDB: boolean;
}

// ── Table creation (idempotent) ──────────────────────────────────────────────

export async function ensureAdvisorTables(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS advisor_profiles (
      deal_id            VARCHAR(64) PRIMARY KEY,
      deal_properties    JSONB NOT NULL DEFAULT '{}',
      contacts           JSONB NOT NULL DEFAULT '[]',
      team               JSONB,
      pinned_note        JSONB,
      last_synced_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS advisor_activities (
      id                 SERIAL PRIMARY KEY,
      deal_id            VARCHAR(64) NOT NULL,
      activity_type      VARCHAR(32) NOT NULL,
      hubspot_id         VARCHAR(64) NOT NULL,
      activity_timestamp TIMESTAMPTZ,
      properties         JSONB NOT NULL DEFAULT '{}',
      created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(deal_id, hubspot_id)
    );

    CREATE INDEX IF NOT EXISTS idx_advisor_activities_deal
      ON advisor_activities(deal_id);
    CREATE INDEX IF NOT EXISTS idx_advisor_activities_timestamp
      ON advisor_activities(deal_id, activity_timestamp DESC);
  `);
}

// ── Read from DB ─────────────────────────────────────────────────────────────

/**
 * Get advisor profile + activities from the database.
 * Returns null profile if the advisor hasn't been synced yet.
 */
export async function getAdvisorFromDB(dealId: string): Promise<AdvisorSnapshot> {
  try {
    const [profileResult, activitiesResult] = await Promise.all([
      pool.query<StoredAdvisorProfile>(
        `SELECT deal_id, deal_properties, contacts, team, pinned_note,
                last_synced_at::text, created_at::text
         FROM advisor_profiles WHERE deal_id = $1`,
        [dealId]
      ),
      pool.query<StoredActivity>(
        `SELECT id, deal_id, activity_type, hubspot_id,
                activity_timestamp::text, properties, created_at::text
         FROM advisor_activities
         WHERE deal_id = $1
         ORDER BY activity_timestamp DESC
         LIMIT 50`,
        [dealId]
      ),
    ]);

    return {
      profile: profileResult.rows[0] ?? null,
      activities: activitiesResult.rows,
      fromDB: profileResult.rows.length > 0,
    };
  } catch (err) {
    console.error('[advisor-store] getAdvisorFromDB failed:', err);
    return { profile: null, activities: [], fromDB: false };
  }
}

// ── Write full advisor data to DB (initial sync) ─────────────────────────────

interface FullAdvisorData {
  deal: { id: string; properties: Record<string, unknown> };
  allContacts: unknown[];
  team: Record<string, unknown> | null;
  pinnedNote: unknown | null;
  notes: Array<{ id: string; properties: Record<string, unknown> }>;
  engagements: Array<{ type: string; id: string; timestamp: string; properties: Record<string, unknown> }>;
}

/**
 * Write full advisor data to DB after initial HubSpot fetch.
 * Upserts profile and bulk-inserts activities.
 */
export async function writeAdvisorToDB(data: FullAdvisorData): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Upsert profile
    await client.query(
      `INSERT INTO advisor_profiles (deal_id, deal_properties, contacts, team, pinned_note, last_synced_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT (deal_id) DO UPDATE SET
         deal_properties = EXCLUDED.deal_properties,
         contacts        = EXCLUDED.contacts,
         team            = EXCLUDED.team,
         pinned_note     = EXCLUDED.pinned_note,
         last_synced_at  = NOW(),
         updated_at      = NOW()`,
      [
        data.deal.id,
        JSON.stringify(data.deal.properties),
        JSON.stringify(data.allContacts),
        data.team ? JSON.stringify(data.team) : null,
        data.pinnedNote ? JSON.stringify(data.pinnedNote) : null,
      ]
    );

    // Bulk upsert activities (notes)
    for (const note of data.notes) {
      const ts = note.properties?.hs_timestamp as string | undefined;
      await client.query(
        `INSERT INTO advisor_activities (deal_id, activity_type, hubspot_id, activity_timestamp, properties)
         VALUES ($1, 'note', $2, $3, $4)
         ON CONFLICT (deal_id, hubspot_id) DO UPDATE SET
           properties = EXCLUDED.properties,
           activity_timestamp = EXCLUDED.activity_timestamp`,
        [data.deal.id, note.id, ts || null, JSON.stringify(note.properties)]
      );
    }

    // Bulk upsert activities (engagements: emails, calls, meetings)
    for (const eng of data.engagements) {
      await client.query(
        `INSERT INTO advisor_activities (deal_id, activity_type, hubspot_id, activity_timestamp, properties)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (deal_id, hubspot_id) DO UPDATE SET
           properties = EXCLUDED.properties,
           activity_timestamp = EXCLUDED.activity_timestamp`,
        [data.deal.id, eng.type, eng.id, eng.timestamp || null, JSON.stringify(eng.properties)]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[advisor-store] writeAdvisorToDB failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

// ── Incremental sync (background) ────────────────────────────────────────────

interface IncrementalUpdate {
  dealProperties?: Record<string, unknown>;
  newNotes: Array<{ id: string; properties: Record<string, unknown> }>;
  newEngagements: Array<{ type: string; id: string; timestamp: string; properties: Record<string, unknown> }>;
  newContacts?: unknown[];
}

/**
 * Apply incremental updates from a background HubSpot sync.
 * Only writes new/changed data — doesn't touch what hasn't changed.
 */
export async function applyIncrementalUpdate(dealId: string, update: IncrementalUpdate): Promise<number> {
  const client = await pool.connect();
  let changesApplied = 0;

  try {
    await client.query('BEGIN');

    // Update deal properties + contacts if provided
    if (update.dealProperties) {
      await client.query(
        `UPDATE advisor_profiles
         SET deal_properties = $2,
             contacts = COALESCE($3, contacts),
             last_synced_at = NOW(),
             updated_at = NOW()
         WHERE deal_id = $1`,
        [
          dealId,
          JSON.stringify(update.dealProperties),
          update.newContacts ? JSON.stringify(update.newContacts) : null,
        ]
      );
      changesApplied++;
    }

    // Upsert new notes
    for (const note of update.newNotes) {
      const ts = note.properties?.hs_timestamp as string | undefined;
      const result = await client.query(
        `INSERT INTO advisor_activities (deal_id, activity_type, hubspot_id, activity_timestamp, properties)
         VALUES ($1, 'note', $2, $3, $4)
         ON CONFLICT (deal_id, hubspot_id) DO UPDATE SET
           properties = EXCLUDED.properties,
           activity_timestamp = EXCLUDED.activity_timestamp
         WHERE advisor_activities.properties IS DISTINCT FROM EXCLUDED.properties`,
        [dealId, note.id, ts || null, JSON.stringify(note.properties)]
      );
      if (result.rowCount && result.rowCount > 0) changesApplied++;
    }

    // Upsert new engagements
    for (const eng of update.newEngagements) {
      const result = await client.query(
        `INSERT INTO advisor_activities (deal_id, activity_type, hubspot_id, activity_timestamp, properties)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (deal_id, hubspot_id) DO UPDATE SET
           properties = EXCLUDED.properties,
           activity_timestamp = EXCLUDED.activity_timestamp
         WHERE advisor_activities.properties IS DISTINCT FROM EXCLUDED.properties`,
        [dealId, eng.type, eng.id, eng.timestamp || null, JSON.stringify(eng.properties)]
      );
      if (result.rowCount && result.rowCount > 0) changesApplied++;
    }

    // Update last_synced_at regardless
    await client.query(
      `UPDATE advisor_profiles SET last_synced_at = NOW() WHERE deal_id = $1`,
      [dealId]
    );

    await client.query('COMMIT');
    return changesApplied;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[advisor-store] applyIncrementalUpdate failed:', err);
    return 0;
  } finally {
    client.release();
  }
}

/**
 * Format DB data into the same shape the frontend expects from HubSpot.
 * This ensures the page works identically whether data comes from DB or API.
 */
export function formatDBDataForFrontend(snapshot: AdvisorSnapshot) {
  if (!snapshot.profile) return null;

  const { profile, activities } = snapshot;

  // Reconstruct notes from activities
  const notes = activities
    .filter(a => a.activity_type === 'note')
    .map(a => ({
      id: a.hubspot_id,
      properties: a.properties,
    }));

  // Reconstruct engagements from activities
  const engagements = activities
    .filter(a => a.activity_type !== 'note')
    .map(a => ({
      type: a.activity_type,
      id: a.hubspot_id,
      timestamp: a.activity_timestamp || '',
      properties: a.properties as Record<string, string>,
    }));

  return {
    deal: {
      id: profile.deal_id,
      properties: profile.deal_properties,
    },
    notes,
    team: profile.team,
    contact: (profile.contacts as unknown[])?.[0] ?? null,
    pinnedNote: profile.pinned_note,
    allContacts: profile.contacts,
    engagements,
  };
}
