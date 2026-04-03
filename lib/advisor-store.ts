/**
 * Advisor Data Store — Prisma-backed cache with incremental sync
 *
 * Strategy:
 *   1. First visit: Fetch everything from HubSpot, write to Prisma DB, serve
 *   2. Return visits: Serve from Prisma DB instantly
 *   3. Background: Silently fetch only NEW activities (notes, calls, emails)
 *      since last sync, plus deal stage updates. Compare & upsert changes.
 *
 * Tables (Prisma models):
 *   - advisors: Static CRM data (deal, contacts, team, pinned note)
 *   - advisor_activities: Timestamped activities (notes, calls, emails, meetings)
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

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
  id: string;
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

// ── Table creation (no longer needed with Prisma migrations) ────────────────

/**
 * Prisma handles schema creation via migrations.
 * This function is now a no-op but kept for backwards compatibility.
 */
export async function ensureAdvisorTables(): Promise<void> {
  // Prisma migrations handle table creation
  // Run: npx prisma migrate deploy
  return;
}

// ── Read from DB ─────────────────────────────────────────────────────────────

/**
 * Get advisor profile + activities from Prisma database.
 * Returns null profile if the advisor hasn't been synced yet.
 */
export async function getAdvisorFromDB(dealId: string): Promise<AdvisorSnapshot> {
  try {
    // Find advisor by HubSpot deal ID
    const advisor = await prisma.advisor.findUnique({
      where: { hubspot_id: dealId },
      include: {
        activities: {
          orderBy: { timestamp: 'desc' },
          take: 50,
        },
      },
    });

    if (!advisor) {
      return { profile: null, activities: [], fromDB: false };
    }

    // Map Prisma Advisor to StoredAdvisorProfile interface
    const properties = (advisor.properties as Prisma.JsonObject) || {};
    const dealProperties = properties.deal_properties as Record<string, unknown> || {};
    const contacts = properties.contacts as unknown[] || [];
    const team = properties.team as Record<string, unknown> | null;
    const pinnedNote = properties.pinned_note as unknown | null;

    const profile: StoredAdvisorProfile = {
      deal_id: advisor.hubspot_id,
      deal_properties: dealProperties,
      contacts,
      team,
      pinned_note: pinnedNote,
      last_synced_at: advisor.last_synced_at.toISOString(),
      created_at: advisor.created_at.toISOString(),
    };

    // Map Prisma AdvisorActivity to StoredActivity interface
    const activities: StoredActivity[] = advisor.activities.map(a => ({
      id: a.id,
      deal_id: advisor.hubspot_id,
      activity_type: a.type as 'note' | 'email' | 'call' | 'meeting',
      hubspot_id: a.hubspot_id,
      activity_timestamp: a.timestamp.toISOString(),
      properties: (a.properties as Record<string, unknown>) || {},
      created_at: a.created_at.toISOString(),
    }));

    return {
      profile,
      activities,
      fromDB: true,
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
 * Write full advisor data to Prisma DB after initial HubSpot fetch.
 * Upserts advisor profile and bulk-inserts activities.
 */
export async function writeAdvisorToDB(data: FullAdvisorData): Promise<void> {
  try {
    // Extract structured fields from deal properties for easier querying
    const dealProps = data.deal.properties;
    const name = (dealProps.dealname as string) || 'Unknown Advisor';
    const email = (dealProps.email as string) || null;
    const pathway = (dealProps.pathway as string) || null;
    const status = (dealProps.dealstage as string) || null;
    const aum = dealProps.aum ? parseFloat(String(dealProps.aum)) : null;
    const revenue = dealProps.revenue ? parseFloat(String(dealProps.revenue)) : null;

    // Store full HubSpot data in properties JSON field
    const properties = {
      deal_properties: data.deal.properties,
      contacts: data.allContacts,
      team: data.team,
      pinned_note: data.pinnedNote,
    };

    // Upsert advisor profile
    const advisor = await prisma.advisor.upsert({
      where: { hubspot_id: data.deal.id },
      create: {
        hubspot_id: data.deal.id,
        name,
        email,
        pathway,
        status,
        aum,
        revenue,
        properties: properties as Prisma.InputJsonValue,
      },
      update: {
        name,
        email,
        pathway,
        status,
        aum,
        revenue,
        properties: properties as Prisma.InputJsonValue,
        last_synced_at: new Date(),
      },
    });

    // Upsert activities (notes)
    for (const note of data.notes) {
      const ts = note.properties?.hs_timestamp as string | undefined;
      const timestamp = ts ? new Date(parseInt(ts)) : new Date();

      await prisma.advisorActivity.upsert({
        where: { hubspot_id: note.id },
        create: {
          advisor_id: advisor.id,
          hubspot_id: note.id,
          type: 'note',
          subject: null,
          body: (note.properties?.hs_note_body as string) || '',
          timestamp,
          properties: note.properties as Prisma.InputJsonValue,
        },
        update: {
          timestamp,
          body: (note.properties?.hs_note_body as string) || '',
          properties: note.properties as Prisma.InputJsonValue,
        },
      });
    }

    // Upsert activities (engagements: emails, calls, meetings)
    for (const eng of data.engagements) {
      const timestamp = eng.timestamp ? new Date(parseInt(eng.timestamp)) : new Date();

      await prisma.advisorActivity.upsert({
        where: { hubspot_id: eng.id },
        create: {
          advisor_id: advisor.id,
          hubspot_id: eng.id,
          type: eng.type,
          subject: (eng.properties?.hs_engagement_subject as string) || null,
          body: (eng.properties?.hs_engagement_body as string) || '',
          timestamp,
          properties: eng.properties as Prisma.InputJsonValue,
        },
        update: {
          timestamp,
          subject: (eng.properties?.hs_engagement_subject as string) || null,
          body: (eng.properties?.hs_engagement_body as string) || '',
          properties: eng.properties as Prisma.InputJsonValue,
        },
      });
    }
  } catch (err) {
    console.error('[advisor-store] writeAdvisorToDB failed:', err);
    throw err;
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
  let changesApplied = 0;

  try {
    // Find advisor
    const advisor = await prisma.advisor.findUnique({
      where: { hubspot_id: dealId },
    });

    if (!advisor) {
      console.warn(`[advisor-store] Advisor ${dealId} not found for incremental update`);
      return 0;
    }

    // Update deal properties + contacts if provided
    if (update.dealProperties || update.newContacts) {
      const currentProps = (advisor.properties as Prisma.JsonObject) || {};

      const updatedProps = {
        ...currentProps,
        ...(update.dealProperties && { deal_properties: update.dealProperties }),
        ...(update.newContacts && { contacts: update.newContacts }),
      };

      await prisma.advisor.update({
        where: { hubspot_id: dealId },
        data: {
          properties: updatedProps as Prisma.InputJsonValue,
          last_synced_at: new Date(),
        },
      });
      changesApplied++;
    }

    // Upsert new notes
    for (const note of update.newNotes) {
      const ts = note.properties?.hs_timestamp as string | undefined;
      const timestamp = ts ? new Date(parseInt(ts)) : new Date();

      const result = await prisma.advisorActivity.upsert({
        where: { hubspot_id: note.id },
        create: {
          advisor_id: advisor.id,
          hubspot_id: note.id,
          type: 'note',
          subject: null,
          body: (note.properties?.hs_note_body as string) || '',
          timestamp,
          properties: note.properties as Prisma.InputJsonValue,
        },
        update: {
          timestamp,
          body: (note.properties?.hs_note_body as string) || '',
          properties: note.properties as Prisma.InputJsonValue,
        },
      });
      changesApplied++;
    }

    // Upsert new engagements
    for (const eng of update.newEngagements) {
      const timestamp = eng.timestamp ? new Date(parseInt(eng.timestamp)) : new Date();

      const result = await prisma.advisorActivity.upsert({
        where: { hubspot_id: eng.id },
        create: {
          advisor_id: advisor.id,
          hubspot_id: eng.id,
          type: eng.type,
          subject: (eng.properties?.hs_engagement_subject as string) || null,
          body: (eng.properties?.hs_engagement_body as string) || '',
          timestamp,
          properties: eng.properties as Prisma.InputJsonValue,
        },
        update: {
          timestamp,
          subject: (eng.properties?.hs_engagement_subject as string) || null,
          body: (eng.properties?.hs_engagement_body as string) || '',
          properties: eng.properties as Prisma.InputJsonValue,
        },
      });
      changesApplied++;
    }

    // Update last_synced_at
    await prisma.advisor.update({
      where: { hubspot_id: dealId },
      data: { last_synced_at: new Date() },
    });

    return changesApplied;
  } catch (err) {
    console.error('[advisor-store] applyIncrementalUpdate failed:', err);
    return 0;
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
