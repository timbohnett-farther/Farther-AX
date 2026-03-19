import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const HUBSPOT_PAT = process.env.HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_PAT || '';
const PIPELINE_ID = '751770';

const STAGE_LABELS: Record<string, string> = {
  '2496931': 'Step 1 – First Meeting',
  '2496932': 'Step 2 – Financial Model',
  '2496934': 'Step 3 – Advisor Demo',
  '100409509': 'Step 4 – Discovery Day',
  '2496935': 'Step 5 – Offer Review',
  '2496936': 'Step 6 – Offer Accepted',
  '100411705': 'Step 7 – Launched',
  '31214941': 'Holding Pattern',
  '2496937': 'Prospect Passed',
  '26572965': 'Farther Passed',
};

async function fetchPipelineSummary() {
  const res = await fetch('https://api.hubapi.com/crm/v3/objects/deals/search', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${HUBSPOT_PAT}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filterGroups: [{ filters: [{ propertyName: 'pipeline', operator: 'EQ', value: PIPELINE_ID }] }],
      properties: [
        'dealname', 'dealstage', 'transferable_aum', 'desired_start_date',
        'actual_launch_date', 'transition_type', 'current_firm__cloned_',
        'custodian__cloned_', 'firm_type', 'advisor_pain_points',
        'advisor_goals', 'advisor_top_care_abouts', 'onboarder',
        'transition_owner', 'hs_lastmodifieddate',
      ],
      sorts: [{ propertyName: 'hs_lastmodifieddate', direction: 'DESCENDING' }],
      limit: 100,
    }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results as Array<{ id: string; properties: Record<string, string | null> }>).map(d => ({
    id: d.id,
    name: d.properties.dealname,
    stage: STAGE_LABELS[d.properties.dealstage ?? ''] ?? d.properties.dealstage,
    aum: d.properties.transferable_aum ? `$${(parseFloat(d.properties.transferable_aum) / 1e6).toFixed(0)}M` : null,
    targetLaunch: d.properties.desired_start_date,
    actualLaunch: d.properties.actual_launch_date,
    transitionType: d.properties.transition_type,
    priorFirm: d.properties.current_firm__cloned_,
    custodian: d.properties.custodian__cloned_,
    firmType: d.properties.firm_type,
    painPoints: d.properties.advisor_pain_points,
    goals: d.properties.advisor_goals,
    topCareAbouts: d.properties.advisor_top_care_abouts,
    onboarder: d.properties.onboarder,
    transitionOwner: d.properties.transition_owner,
    lastModified: d.properties.hs_lastmodifieddate,
  }));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Lazy-initialize at request time so build doesn't fail without the env var
  const xai = new OpenAI({
    apiKey: process.env.GROK_API_KEY!,
    baseURL: 'https://api.x.ai/v1',
  });

  const { messages } = await req.json() as { messages: Array<{ role: string; content: string }> };

  // Fetch live pipeline data for context
  const pipeline = await fetchPipelineSummary();
  const now = new Date();
  const stalled = pipeline.filter(d => {
    if (!d.lastModified) return false;
    const daysSinceUpdate = (now.getTime() - new Date(d.lastModified).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceUpdate > 30 && !['Prospect Passed', 'Farther Passed', 'Step 7 – Launched'].includes(d.stage ?? '');
  });
  const upcoming = pipeline.filter(d => {
    if (!d.targetLaunch) return false;
    const daysUntil = (new Date(d.targetLaunch).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysUntil >= 0 && daysUntil <= 60;
  });

  const systemPrompt = `You are the Farther AX Command Center AI assistant. You help the Advisor Experience (AX) team manage advisor onboarding and recruiting pipeline.

Today is ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.

## Current Pipeline (${pipeline.length} deals)
${JSON.stringify(pipeline.slice(0, 50), null, 2)}

## Stalled Deals (no update in 30+ days): ${stalled.length}
${stalled.map(d => `- ${d.name} (${d.stage}, ${d.aum ?? 'AUM unknown'})`).join('\n')}

## Upcoming Launches (next 60 days): ${upcoming.length}
${upcoming.map(d => `- ${d.name}: target ${d.targetLaunch}, ${d.aum ?? 'AUM unknown'}, ${d.transitionType ?? 'transition type unknown'}`).join('\n')}

## Your capabilities:
- Answer questions about any advisor in the pipeline
- Surface risks, stalled deals, upcoming deadlines
- Summarize advisor profiles (goals, pain points, tech stack, top care abouts)
- Provide pipeline analytics and insights
- Generate advisor reports and summaries
- Flag compliance or transition risks

Be concise, factual, and action-oriented. Format responses with markdown when helpful. Reference specific advisor names and data.`;

  try {
    const completion = await xai.chat.completions.create({
      model: 'grok-3-latest',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages as Array<{ role: 'user' | 'assistant'; content: string }>,
      ],
      max_tokens: 1500,
      temperature: 0.3,
    });

    const reply = completion.choices[0]?.message?.content ?? 'No response generated.';
    return NextResponse.json({ reply });
  } catch (err) {
    console.error('[grok ai]', err);
    return NextResponse.json({ error: 'AI request failed' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
