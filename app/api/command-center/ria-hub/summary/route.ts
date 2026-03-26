import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { aiComplete } from '@/lib/ai-router';

type SummaryType = 'briefing' | 'activities' | 'emails' | 'engagements';

const SYSTEM_PROMPTS: Record<SummaryType, string> = {
  briefing: `You are an AI assistant for Farther's Advisor Experience team. Generate a concise relationship manager briefing for an advisor transitioning to Farther.

Your briefing should be 3-5 bullet points covering:
- Key background (years in industry, firm background, book size)
- What matters most to this advisor (care-abouts, pain points, goals)
- Important relationship context from notes and calls
- Any risks or things to watch for
- Recommended engagement approach

Be direct, actionable, and specific. Use the advisor's first name. No fluff.`,

  activities: `You are an AI assistant for Farther's Advisor Experience team. Summarize the recent activity and engagement history for this advisor.

Provide a concise timeline-style summary covering:
- Key milestones and dates
- Recent conversations and their outcomes
- Pending action items or follow-ups
- Overall engagement momentum (increasing, steady, declining)
- Next logical touchpoint recommendation

Use bullet points. Be concise and action-oriented. Highlight anything time-sensitive.`,

  emails: `You are an AI assistant for Farther's Advisor Experience team. Summarize the email communication between Farther employees and this advisor.

Provide a digest covering:
- Communication frequency and pattern
- Key topics discussed via email
- Outstanding requests or unanswered questions
- Tone and responsiveness of the advisor
- Any commitments or promises made in emails

Be specific about dates and subjects. Flag any communication gaps. Keep it to 4-6 bullet points.`,

  engagements: `You are an AI assistant for Farther's Advisor Experience team. Summarize all engagement touchpoints (calls, meetings, notes) for this advisor.

Provide an overview covering:
- Total engagement count and frequency
- Key themes across conversations
- Advisor sentiment and engagement level
- Critical decisions or turning points
- Relationship health assessment (strong, needs attention, at risk)

Be specific. Reference actual content from notes and calls. Keep it to 4-6 bullet points.`,
};

function buildContext(data: Record<string, unknown>, summaryType: SummaryType): string {
  const { deal, contacts, notes, calls, emails, team } = data as {
    deal: Record<string, string | null>;
    contacts: Array<Record<string, string>>;
    notes: Array<{ timestamp: string; body: string }>;
    calls: Array<{ timestamp: string; title: string; body: string; duration: string; recordingUrl: string }>;
    emails: Array<{ timestamp: string; subject: string; body: string; direction: string }>;
    team: Record<string, string | null> | null;
  };

  let context = `## Advisor: ${deal.dealname}
Stage: ${deal.stageLabel || 'Unknown'}
Prior Firm: ${deal.current_firm__cloned_ || 'Unknown'}
Firm Type: ${deal.firm_type || 'Unknown'}
Transferable AUM: ${deal.transferable_aum ? `$${(parseFloat(deal.transferable_aum) / 1e6).toFixed(0)}M` : 'Unknown'}
Households: ${deal.client_households || team?.client_households || 'Unknown'}
Target Launch: ${deal.desired_start_date || 'TBD'}
Actual Launch: ${deal.actual_launch_date || 'Not yet launched'}
Transition Type: ${deal.transition_type || team?.transition_type || 'Unknown'}

## Contacts
${(contacts || []).map((c) => `- ${c.firstName} ${c.lastName}: ${c.jobTitle || 'No title'}, ${c.email || 'No email'}, Years in Industry: ${c.yearsInIndustry || 'Unknown'}, Licenses: ${c.licenses || 'Unknown'}`).join('\n')}
`;

  if (summaryType === 'briefing' || summaryType === 'engagements') {
    context += `
## Advisor Intel
Pain Points: ${deal.advisor_pain_points || 'Not captured'}
Care Abouts: ${deal.advisor_top_care_abouts || 'Not captured'}
Goals: ${deal.advisor_goals || 'Not captured'}
Go-to-Market: ${deal.advisor_go_to_market_strategy || 'Not captured'}

## Team/Practice Details
People: ${deal.people || team?.people || 'Unknown'}
Support Staff: ${team?.support_staff || 'Unknown'}
Payout Rate: ${team?.payout_rate ? `${team.payout_rate}%` : 'Unknown'}
OBAs: ${team?.obas__yes_no || 'Unknown'}
Employment Contract: ${team?.employment_contract || 'Unknown'}
Restrictive Covenants: ${team?.restrictive_covenants || 'Unknown'}
`;
  }

  // Always include notes for context
  context += `
## Recent Notes (${(notes || []).length} total)
${(notes || []).slice(0, 15).map((n) => `[${n.timestamp ? new Date(n.timestamp).toLocaleDateString() : 'Unknown date'}] ${n.body.slice(0, 500)}`).join('\n\n')}
`;

  if (summaryType === 'activities' || summaryType === 'engagements') {
    context += `
## Recent Calls (${(calls || []).length} total)
${(calls || []).slice(0, 10).map((c) => `[${c.timestamp ? new Date(c.timestamp).toLocaleDateString() : 'Unknown date'}] ${c.title || 'Call'}${c.duration ? ` (${Math.round(parseInt(c.duration) / 60000)}min)` : ''}: ${c.body.slice(0, 400)}`).join('\n\n')}
`;
  }

  if (summaryType === 'emails' || summaryType === 'activities') {
    context += `
## Recent Emails (${(emails || []).length} total)
${(emails || []).slice(0, 10).map((e) => `[${e.timestamp ? new Date(e.timestamp).toLocaleDateString() : 'Unknown date'}] ${e.direction === 'INCOMING_EMAIL' ? 'FROM ADVISOR: ' : 'FROM FARTHER: '}${e.subject || 'No subject'}\n${e.body.slice(0, 300)}`).join('\n\n')}
`;
  }

  return context;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const summaryType: SummaryType = body.summaryType || 'briefing';
  const systemPrompt = SYSTEM_PROMPTS[summaryType] || SYSTEM_PROMPTS.briefing;
  const context = buildContext(body, summaryType);

  // Map summary types to AI task types for optimal model routing
  const taskMap: Record<SummaryType, 'briefing' | 'activities' | 'emails' | 'engagements'> = {
    briefing: 'briefing',
    activities: 'activities',
    emails: 'emails',
    engagements: 'engagements',
  };

  try {
    const result = await aiComplete({
      task: taskMap[summaryType] || 'briefing',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: context },
      ],
      maxTokens: 800,
    });

    return NextResponse.json({ summary: result.content, type: summaryType, model: result.model });
  } catch (err) {
    console.error('[ria-hub summary]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
