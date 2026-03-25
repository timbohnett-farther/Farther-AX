import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

const HUBSPOT_PAT = process.env.HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_PAT || '';
const PIPELINE_ID = '751770';  // AX Pipeline

interface HubSpotContact {
  id: string;
  properties: {
    firstname?: string;
    lastname?: string;
    email?: string;
  };
}

interface TeamMapping {
  individualName: string;
  teamName: string;
  hubspotContactId: string;
  hubspotDealId: string;
}

/**
 * Fetch associated contacts for a deal
 */
async function fetchDealContacts(dealId: string): Promise<HubSpotContact[]> {
  const url = `https://api.hubapi.com/crm/v4/objects/deals/${dealId}/associations/contacts`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${HUBSPOT_PAT}` },
  });

  if (!res.ok) {
    console.error(`Failed to fetch contacts for deal ${dealId}: ${res.status}`);
    return [];
  }

  const data = await res.json();
  const contactIds = (data.results ?? []).map((r: any) => r.toObjectId);

  if (contactIds.length === 0) return [];

  // Batch fetch contact details
  const batchUrl = 'https://api.hubapi.com/crm/v3/objects/contacts/batch/read';
  const batchRes = await fetch(batchUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HUBSPOT_PAT}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: contactIds.map((id: string) => ({ id })),
      properties: ['firstname', 'lastname', 'email'],
    }),
  });

  if (!batchRes.ok) {
    console.error(`Failed to batch fetch contacts: ${batchRes.status}`);
    return [];
  }

  const batchData = await batchRes.json();
  return batchData.results ?? [];
}

/**
 * Fetch all deals in AX pipeline and extract team mappings
 */
async function syncTeamMappingsFromHubSpot(): Promise<TeamMapping[]> {
  const mappings: TeamMapping[] = [];
  let after: string | undefined;

  do {
    const body = {
      filterGroups: [{
        filters: [{ propertyName: 'pipeline', operator: 'EQ', value: PIPELINE_ID }],
      }],
      properties: ['dealname'],
      limit: 100,
      ...(after ? { after } : {}),
    };

    const res = await fetch('https://api.hubapi.com/crm/v3/objects/deals/search', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HUBSPOT_PAT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) break;

    const data = await res.json();

    for (const deal of data.results ?? []) {
      const dealId = deal.id;
      const teamName = (deal.properties?.dealname ?? '').trim();

      if (!teamName || teamName.toLowerCase().includes('test')) continue;

      // Fetch associated contacts
      const contacts = await fetchDealContacts(dealId);

      for (const contact of contacts) {
        const firstName = (contact.properties?.firstname ?? '').trim();
        const lastName = (contact.properties?.lastname ?? '').trim();

        if (!firstName && !lastName) continue;

        const individualName = `${firstName} ${lastName}`.trim();

        mappings.push({
          individualName,
          teamName,
          hubspotContactId: contact.id,
          hubspotDealId: dealId,
        });
      }
    }

    after = data.paging?.next?.after;
  } while (after);

  return mappings;
}

/**
 * GET /api/command-center/transitions/team-mappings
 * Returns current team mappings
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const result = await pool.query(`
      SELECT
        individual_name,
        team_name,
        hubspot_contact_id,
        hubspot_deal_id,
        source,
        notes,
        created_at,
        updated_at
      FROM advisor_team_mappings
      ORDER BY team_name, individual_name
    `);

    // Group by team
    const teams: Record<string, any[]> = {};

    for (const row of result.rows) {
      const teamName = row.team_name;
      if (!teams[teamName]) {
        teams[teamName] = [];
      }
      teams[teamName].push({
        individualName: row.individual_name,
        hubspotContactId: row.hubspot_contact_id,
        hubspotDealId: row.hubspot_deal_id,
        source: row.source,
        notes: row.notes,
      });
    }

    return NextResponse.json({
      totalMappings: result.rows.length,
      totalTeams: Object.keys(teams).length,
      teams,
      mappings: result.rows,
    });
  } catch (err) {
    console.error('[team-mappings GET]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/command-center/transitions/team-mappings
 * Sync team mappings from HubSpot
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    console.log('[team-mappings] Starting sync from HubSpot...');

    const mappings = await syncTeamMappingsFromHubSpot();

    console.log(`[team-mappings] Found ${mappings.length} individual-to-team mappings`);

    let inserted = 0;
    let updated = 0;

    for (const mapping of mappings) {
      const result = await pool.query(
        `
        INSERT INTO advisor_team_mappings (
          individual_name,
          team_name,
          hubspot_contact_id,
          hubspot_deal_id,
          source,
          updated_at
        )
        VALUES ($1, $2, $3, $4, 'hubspot', NOW())
        ON CONFLICT (individual_name) DO UPDATE SET
          team_name = EXCLUDED.team_name,
          hubspot_contact_id = EXCLUDED.hubspot_contact_id,
          hubspot_deal_id = EXCLUDED.hubspot_deal_id,
          source = EXCLUDED.source,
          updated_at = NOW()
        RETURNING (xmax = 0) AS inserted
        `,
        [
          mapping.individualName,
          mapping.teamName,
          mapping.hubspotContactId,
          mapping.hubspotDealId,
        ]
      );

      if (result.rows[0]?.inserted) {
        inserted++;
      } else {
        updated++;
      }
    }

    return NextResponse.json({
      success: true,
      totalMappings: mappings.length,
      inserted,
      updated,
      message: `Synced ${mappings.length} team mappings (${inserted} new, ${updated} updated)`,
    });
  } catch (err) {
    console.error('[team-mappings POST]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
