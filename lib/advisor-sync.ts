import { prisma } from '@/lib/prisma';

interface HubSpotAdvisor {
  id: string;
  properties: {
    firstname?: string;
    lastname?: string;
    email?: string;
    phone?: string;
    lifecyclestage?: string;
    hs_lead_status?: string;
    pathway?: string;
    launch_date?: string;
    graduation_date?: string;
    axm_owner?: string;
    axa_owner?: string;
    ctm_owner?: string;
    city?: string;
    state?: string;
    previous_firm?: string;
    aum?: string;
    revenue?: string;
    account_count?: string;
    household_count?: string;
    complexity_score?: string;
    health_score?: string;
    sentiment?: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

interface HubSpotActivity {
  id: string;
  properties: {
    hs_timestamp?: string;
    hs_activity_type?: string;
    hs_body?: string;
    hs_created_by?: string;
    hs_owner_id?: string;
    [key: string]: any;
  };
  associations?: {
    contacts?: {
      results: Array<{ id: string }>;
    };
  };
}

/**
 * Fetch all advisors from HubSpot with pagination
 */
async function fetchAllAdvisorsFromHubSpot(): Promise<HubSpotAdvisor[]> {
  const allAdvisors: HubSpotAdvisor[] = [];
  let after: string | undefined = undefined;
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('HUBSPOT_ACCESS_TOKEN not set');
  }

  do {
    const url = new URL('https://api.hubapi.com/crm/v3/objects/contacts/search');

    const requestBody: any = {
      filterGroups: [
        {
          filters: [
            {
              propertyName: 'lifecyclestage',
              operator: 'EQ',
              value: 'advisor',
            },
          ],
        },
      ],
      properties: [
        'firstname',
        'lastname',
        'email',
        'phone',
        'lifecyclestage',
        'hs_lead_status',
        'pathway',
        'launch_date',
        'graduation_date',
        'axm_owner',
        'axa_owner',
        'ctm_owner',
        'city',
        'state',
        'previous_firm',
        'aum',
        'revenue',
        'account_count',
        'household_count',
        'complexity_score',
        'health_score',
        'sentiment',
      ],
      limit: 100,
      after,
    };

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      if (response.status === 429) {
        // Rate limited - wait and retry
        console.log('[Sync] Rate limited, waiting 2 seconds...');
        await new Promise((resolve) => setTimeout(resolve, 2000));
        continue;
      }
      throw new Error(`HubSpot API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    allAdvisors.push(...(data.results || []));

    after = data.paging?.next?.after;
  } while (after);

  console.log(`[Sync] Fetched ${allAdvisors.length} advisors from HubSpot`);
  return allAdvisors;
}

/**
 * Fetch activities for a specific advisor from HubSpot
 */
async function fetchAdvisorActivities(hubspotId: string): Promise<HubSpotActivity[]> {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('HUBSPOT_ACCESS_TOKEN not set');
  }

  // Fetch notes (engagements)
  const url = `https://api.hubapi.com/crm/v3/objects/contacts/${hubspotId}/associations/notes`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return []; // No activities found
    }
    throw new Error(`Failed to fetch activities: ${response.status}`);
  }

  const data = await response.json();
  return data.results || [];
}

/**
 * Parse advisor data from HubSpot format to database format
 */
function parseAdvisorData(advisor: HubSpotAdvisor) {
  const props = advisor.properties;
  const name = [props.firstname, props.lastname].filter(Boolean).join(' ') || 'Unknown';

  return {
    hubspot_id: advisor.id,
    name,
    email: props.email || null,
    phone: props.phone || null,
    pathway: props.pathway || null,
    status: props.hs_lead_status || null,
    launch_date: props.launch_date ? new Date(props.launch_date) : null,
    graduation_date: props.graduation_date ? new Date(props.graduation_date) : null,
    axm_owner: props.axm_owner || null,
    axa_owner: props.axa_owner || null,
    ctm_owner: props.ctm_owner || null,
    aum: props.aum ? parseFloat(props.aum) : null,
    revenue: props.revenue ? parseFloat(props.revenue) : null,
    account_count: props.account_count ? parseInt(props.account_count) : null,
    household_count: props.household_count ? parseInt(props.household_count) : null,
    complexity_score: props.complexity_score ? parseInt(props.complexity_score) : null,
    health_score: props.health_score || null,
    sentiment: props.sentiment || null,
    city: props.city || null,
    state: props.state || null,
    previous_firm: props.previous_firm || null,
    properties: props, // Store full HubSpot data as JSON
    last_synced_at: new Date(),
  };
}

/**
 * Sync all advisors from HubSpot to database
 */
export async function syncAllAdvisors() {
  const startTime = Date.now();
  console.log('[Sync] Starting full advisor sync...');

  try {
    // Create sync job record
    const syncJob = await prisma.syncJob.create({
      data: {
        job_type: 'full_sync',
        status: 'running',
        started_at: new Date(),
      },
    });

    // Fetch all advisors from HubSpot
    const advisors = await fetchAllAdvisorsFromHubSpot();

    let successCount = 0;
    let failCount = 0;

    // Upsert each advisor into database
    for (const advisor of advisors) {
      try {
        const data = parseAdvisorData(advisor);

        await prisma.advisor.upsert({
          where: { hubspot_id: advisor.id },
          update: data,
          create: data,
        });

        successCount++;
      } catch (error) {
        console.error(`[Sync] Failed to sync advisor ${advisor.id}:`, error);
        failCount++;
      }
    }

    const duration = Date.now() - startTime;

    // Update sync job with results
    await prisma.syncJob.update({
      where: { id: syncJob.id },
      data: {
        status: 'completed',
        records_synced: successCount,
        records_failed: failCount,
        completed_at: new Date(),
        duration_ms: duration,
      },
    });

    console.log(
      `[Sync] ✓ Sync complete: ${successCount} synced, ${failCount} failed in ${duration}ms`
    );

    return {
      success: true,
      synced: successCount,
      failed: failCount,
      duration,
    };
  } catch (error) {
    console.error('[Sync] Sync failed:', error);

    // Log failed sync job
    await prisma.syncJob.create({
      data: {
        job_type: 'full_sync',
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        started_at: new Date(),
        completed_at: new Date(),
        duration_ms: Date.now() - startTime,
      },
    });

    throw error;
  }
}

/**
 * Sync a single advisor by HubSpot ID
 */
export async function syncSingleAdvisor(hubspotId: string) {
  console.log(`[Sync] Syncing single advisor: ${hubspotId}`);

  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('HUBSPOT_ACCESS_TOKEN not set');
  }

  // Fetch single advisor
  const url = `https://api.hubapi.com/crm/v3/objects/contacts/${hubspotId}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch advisor: ${response.status}`);
  }

  const advisor = await response.json();
  const data = parseAdvisorData(advisor);

  await prisma.advisor.upsert({
    where: { hubspot_id: hubspotId },
    update: data,
    create: data,
  });

  console.log(`[Sync] ✓ Synced advisor ${hubspotId}`);

  return { success: true };
}

/**
 * Sync activities for a specific advisor
 */
export async function syncAdvisorActivities(hubspotId: string) {
  console.log(`[Sync] Syncing activities for advisor: ${hubspotId}`);

  const activities = await fetchAdvisorActivities(hubspotId);

  for (const activity of activities) {
    const props = activity.properties;

    await prisma.advisorActivity.upsert({
      where: { hubspot_id: activity.id },
      update: {
        type: props.hs_activity_type || 'note',
        subject: null,
        body: props.hs_body || null,
        timestamp: props.hs_timestamp ? new Date(props.hs_timestamp) : new Date(),
        created_by: props.hs_created_by || null,
        owner_id: props.hs_owner_id || null,
        properties: props,
      },
      create: {
        hubspot_id: activity.id,
        advisor_id: hubspotId,
        type: props.hs_activity_type || 'note',
        subject: null,
        body: props.hs_body || null,
        timestamp: props.hs_timestamp ? new Date(props.hs_timestamp) : new Date(),
        created_by: props.hs_created_by || null,
        owner_id: props.hs_owner_id || null,
        properties: props,
      },
    });
  }

  console.log(`[Sync] ✓ Synced ${activities.length} activities for advisor ${hubspotId}`);

  return { success: true, count: activities.length };
}
