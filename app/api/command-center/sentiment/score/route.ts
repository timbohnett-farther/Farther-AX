/**
 * app/api/command-center/sentiment/score/route.ts
 *
 * POST /api/command-center/sentiment/score
 *
 * Receives { dealId: string } and runs the full sentiment scoring pipeline:
 *   1. Fetch deal + stage from HubSpot
 *   2. Fetch associated contact
 *   3. Fetch engagements (emails, calls, meetings — last 30 days)
 *   4. Fetch deal notes
 *   5. Send engagement + note text to Grok for NLP tone analysis
 *   6. Compute all 4 signal scores via lib/sentiment.ts
 *   7. Apply EMA if a previous score exists in advisor_sentiment
 *   8. Apply downgrade guard via shouldDowngrade()
 *   9. Upsert to advisor_sentiment, append to advisor_sentiment_history
 *  10. Return full SentimentResult + tier
 */

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { aiComplete } from '@/lib/ai-router';
import {
  type Engagement,
  type SentimentSignals,
  computeActivityScore,
  computeMilestoneScore,
  computeRecencyScore,
  computeCompositeScore,
  applyEMA,
  shouldDowngrade,
  getTier,
  buildSentimentResult,
} from '@/lib/sentiment';

export const dynamic = 'force-dynamic';

// ── Constants ─────────────────────────────────────────────────────────────────

const HUBSPOT_PAT = process.env.HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_PAT || '';
const ENGAGEMENT_WINDOW_DAYS = 30;

// ── Grok tone analysis response shape ────────────────────────────────────────

interface GrokToneItem {
  type: 'email' | 'call' | 'meeting' | 'note';
  sentiment: 'positive' | 'neutral' | 'negative';
  intensity: number;       // 0.0–1.0
  is_process_directed: boolean;
  summary: string;
}

interface GrokToneResponse {
  overall_tone_score: number; // 0–100
  items: GrokToneItem[];
}

// ── HubSpot helpers ───────────────────────────────────────────────────────────

async function fetchDeal(dealId: string) {
  const props = [
    'dealname', 'dealstage', 'hubspot_owner_id', 'createdate',
    'hs_lastmodifieddate', 'closedate',
  ].join(',');

  const res = await fetch(
    `https://api.hubapi.com/crm/v3/objects/deals/${dealId}?properties=${props}&associations=contacts`,
    { headers: { Authorization: `Bearer ${HUBSPOT_PAT}` } }
  );
  if (!res.ok) throw new Error(`HubSpot deal fetch failed: ${res.status} ${res.statusText}`);
  return res.json();
}

async function fetchAssociatedContactId(dealId: string): Promise<string | null> {
  const res = await fetch(
    `https://api.hubapi.com/crm/v4/objects/deals/${dealId}/associations/contacts`,
    { headers: { Authorization: `Bearer ${HUBSPOT_PAT}` } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const results: { toObjectId: string }[] = data.results ?? [];
  return results.length > 0 ? results[0].toObjectId : null;
}

async function fetchEngagements(contactId: string): Promise<Engagement[]> {
  const cutoffMs = Date.now() - ENGAGEMENT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const cutoffIso = new Date(cutoffMs).toISOString();

  const engagementDefs = [
    {
      type: 'email',
      objectType: 'emails',
      props: ['hs_email_subject', 'hs_email_direction', 'hs_email_status', 'hs_timestamp', 'hs_email_text'],
    },
    {
      type: 'call',
      objectType: 'calls',
      props: ['hs_call_title', 'hs_call_direction', 'hs_call_status', 'hs_call_duration', 'hs_timestamp', 'hs_call_body'],
    },
    {
      type: 'meeting',
      objectType: 'meetings',
      props: ['hs_meeting_title', 'hs_meeting_outcome', 'hs_timestamp', 'hs_meeting_start_time', 'hs_meeting_end_time', 'hs_meeting_body'],
    },
  ];

  const results: Engagement[] = [];

  await Promise.all(
    engagementDefs.map(async ({ type, objectType, props }) => {
      try {
        const res = await fetch(`https://api.hubapi.com/crm/v3/objects/${objectType}/search`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${HUBSPOT_PAT}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filterGroups: [
              {
                filters: [
                  { propertyName: 'associations.contact', operator: 'EQ', value: contactId },
                  { propertyName: 'hs_timestamp', operator: 'GTE', value: cutoffIso },
                ],
              },
            ],
            properties: props,
            sorts: [{ propertyName: 'hs_timestamp', direction: 'DESCENDING' }],
            limit: 50,
          }),
        });
        if (!res.ok) return;
        const data = await res.json();
        for (const item of data.results ?? []) {
          results.push({
            type: type as Engagement['type'],
            id: item.id,
            timestamp: item.properties?.hs_timestamp ?? '',
            properties: item.properties ?? {},
          });
        }
      } catch (err) {
        console.warn('[sentiment/score] Engagement fetch skipped:', err instanceof Error ? err.message : String(err));
      }
    })
  );

  results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return results;
}

async function fetchDealNotes(dealId: string): Promise<{ body: string; timestamp: string }[]> {
  const res = await fetch('https://api.hubapi.com/crm/v3/objects/notes/search', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HUBSPOT_PAT}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filterGroups: [
        { filters: [{ propertyName: 'associations.deal', operator: 'EQ', value: dealId }] },
      ],
      properties: ['hs_note_body', 'hs_timestamp'],
      sorts: [{ propertyName: 'hs_timestamp', direction: 'DESCENDING' }],
      limit: 20,
    }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results ?? []).map((n: { properties: Record<string, string> }) => ({
    body: n.properties?.hs_note_body ?? '',
    timestamp: n.properties?.hs_timestamp ?? '',
  }));
}

// ── HTML stripping (mirrors parse-note pattern) ───────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<\/li>/gi, ' ')
    .replace(/<\/div>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#\d+;/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// ── Grok NLP tone analysis ────────────────────────────────────────────────────

const TONE_SYSTEM_PROMPT = `You are a sentiment analysis assistant for Farther Wealth Management's advisor recruiting pipeline.

You will receive a list of communications and notes between the Farther recruiting team and a prospective advisor during their onboarding/transition process. Analyze each item for sentiment.

IMPORTANT: Only count PROCESS-DIRECTED sentiment — meaning frustration, enthusiasm, concern, or satisfaction that is about the transition process, the firm, the offer, or the working relationship. Ignore sentiment about external life events (market volatility, client issues, personal events) unless they directly reference the transition experience.

Return ONLY valid JSON in this exact shape, no markdown, no explanation:
{
  "overall_tone_score": <integer 0-100, where 0=extremely negative, 50=neutral, 100=extremely positive>,
  "items": [
    {
      "type": "<email|call|meeting|note>",
      "sentiment": "<positive|neutral|negative>",
      "intensity": <float 0.0-1.0>,
      "is_process_directed": <boolean>,
      "summary": "<one sentence>"
    }
  ]
}

If there is no process-directed content, set overall_tone_score to 50 (neutral) and return items with is_process_directed: false.`;

async function analyzeEngagementTone(
  engagements: Engagement[],
  notes: { body: string; timestamp: string }[]
): Promise<GrokToneResponse> {
  // Build the items list for Grok — collect text content from each engagement type
  const itemLines: string[] = [];

  for (const eng of engagements) {
    const p = eng.properties;
    let text = '';

    if (eng.type === 'email') {
      const subject = p.hs_email_subject ?? '';
      const body = stripHtml(p.hs_email_text ?? '');
      text = [subject, body].filter(Boolean).join(' | ').slice(0, 800);
    } else if (eng.type === 'call') {
      const title = p.hs_call_title ?? '';
      const body = stripHtml(p.hs_call_body ?? '');
      text = [title, body].filter(Boolean).join(' | ').slice(0, 800);
    } else if (eng.type === 'meeting') {
      const title = p.hs_meeting_title ?? '';
      const body = stripHtml(p.hs_meeting_body ?? '');
      text = [title, body].filter(Boolean).join(' | ').slice(0, 800);
    }

    if (text.trim()) {
      itemLines.push(`[${eng.type.toUpperCase()} — ${eng.timestamp.slice(0, 10)}] ${text}`);
    }
  }

  for (const note of notes) {
    const body = stripHtml(note.body ?? '').slice(0, 800);
    if (body) {
      itemLines.push(`[NOTE — ${note.timestamp.slice(0, 10)}] ${body}`);
    }
  }

  // Neutral fallback when there is nothing to analyze
  if (itemLines.length === 0) {
    return {
      overall_tone_score: 50,
      items: [],
    };
  }

  const userContent = `Analyze the sentiment of the following communications:\n\n${itemLines.join('\n\n')}`;

  const result = await aiComplete({
    task: 'sentiment',
    messages: [
      { role: 'system', content: TONE_SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
    maxTokens: 2048,
  });

  const raw = result.content;

  try {
    const jsonStr = raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    return JSON.parse(jsonStr) as GrokToneResponse;
  } catch {
    console.error('[sentiment/score] Failed to parse AI tone response:', raw.slice(0, 500));
    // Return a neutral fallback so the pipeline continues
    return { overall_tone_score: 50, items: [] };
  }
}

// ── Derive tone signal details from Grok items ────────────────────────────────

function buildToneSignalDetails(grokResponse: GrokToneResponse): {
  toneScore: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  details: string[];
} {
  // Only count process-directed items in the signal breakdown
  const processItems = grokResponse.items.filter((i) => i.is_process_directed);
  const allItems = grokResponse.items;

  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;
  const details: string[] = [];

  for (const item of processItems) {
    if (item.sentiment === 'positive') positiveCount++;
    else if (item.sentiment === 'negative') negativeCount++;
    else neutralCount++;

    if (item.summary) {
      details.push(`[${item.type}] ${item.sentiment} (${(item.intensity * 100).toFixed(0)}%): ${item.summary}`);
    }
  }

  // If no process-directed items exist, fall through to neutral counts from all items
  if (processItems.length === 0) {
    for (const item of allItems) {
      if (item.sentiment === 'positive') positiveCount++;
      else if (item.sentiment === 'negative') negativeCount++;
      else neutralCount++;
    }
  }

  // The overall_tone_score from Grok is already 0-100 — use directly
  const toneScore = Math.min(100, Math.max(0, Math.round(grokResponse.overall_tone_score)));

  return { toneScore, positiveCount, negativeCount, neutralCount, details };
}

// ── Database helpers ──────────────────────────────────────────────────────────

interface PreviousScore {
  composite_score: number;
  activity_score: number;
  tone_score: number;
  milestone_score: number;
  recency_score: number;
  tier: string;
}

async function fetchPreviousScore(dealId: string): Promise<PreviousScore | null> {
  try {
    const result = await pool.query<PreviousScore>(
      `SELECT composite_score, activity_score, tone_score, milestone_score, recency_score, tier
       FROM advisor_sentiment
       WHERE deal_id = $1
       LIMIT 1`,
      [dealId]
    );
    return result.rows[0] ?? null;
  } catch {
    // Table may not exist yet — treat as no previous score
    return null;
  }
}

async function upsertSentimentScore(params: {
  dealId: string;
  dealName: string;
  contactId: string | null;
  compositeScore: number;
  activityScore: number;
  toneScore: number;
  milestoneScore: number;
  recencyScore: number;
  tier: string;
  dealStage: string;
  engagementsAnalyzed: number;
  signals: SentimentSignals;
}): Promise<void> {
  const {
    dealId, dealName, contactId, compositeScore, activityScore, toneScore,
    milestoneScore, recencyScore, tier, dealStage, engagementsAnalyzed, signals,
  } = params;

  const signalsJson = JSON.stringify(signals);

  await pool.query(
    `INSERT INTO advisor_sentiment (
       deal_id, deal_name, contact_id, composite_score,
       activity_score, tone_score, milestone_score, recency_score,
       tier, deal_stage, engagements_analyzed, signals, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, NOW())
     ON CONFLICT (deal_id) DO UPDATE SET
       deal_name            = EXCLUDED.deal_name,
       contact_id           = EXCLUDED.contact_id,
       composite_score      = EXCLUDED.composite_score,
       activity_score       = EXCLUDED.activity_score,
       tone_score           = EXCLUDED.tone_score,
       milestone_score      = EXCLUDED.milestone_score,
       recency_score        = EXCLUDED.recency_score,
       tier                 = EXCLUDED.tier,
       deal_stage           = EXCLUDED.deal_stage,
       engagements_analyzed = EXCLUDED.engagements_analyzed,
       signals              = EXCLUDED.signals,
       updated_at           = NOW()`,
    [
      dealId, dealName, contactId, compositeScore,
      activityScore, toneScore, milestoneScore, recencyScore,
      tier, dealStage, engagementsAnalyzed, signalsJson,
    ]
  );
}

async function appendSentimentHistory(params: {
  dealId: string;
  compositeScore: number;
  activityScore: number;
  toneScore: number;
  milestoneScore: number;
  recencyScore: number;
  tier: string;
  engagementsAnalyzed: number;
}): Promise<void> {
  const {
    dealId, compositeScore, activityScore, toneScore,
    milestoneScore, recencyScore, tier, engagementsAnalyzed,
  } = params;

  await pool.query(
    `INSERT INTO advisor_sentiment_history (
       deal_id, composite_score, activity_score, tone_score,
       milestone_score, recency_score, tier, engagements_analyzed, scored_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
    [
      dealId, compositeScore, activityScore, toneScore,
      milestoneScore, recencyScore, tier, engagementsAnalyzed,
    ]
  );
}

// ── POST handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { dealId } = body as { dealId?: string };

    if (!dealId || typeof dealId !== 'string' || !dealId.trim()) {
      return NextResponse.json({ error: 'dealId is required' }, { status: 400 });
    }

    // Step 1: Fetch deal from HubSpot
    const dealData = await fetchDeal(dealId.trim());
    const dealStage: string = dealData.properties?.dealstage ?? '';
    const dealName: string = dealData.properties?.dealname ?? dealId;

    // Step 2: Fetch associated contact ID
    const contactId = await fetchAssociatedContactId(dealId);

    // Steps 3 & 4: Fetch engagements and deal notes in parallel
    const [engagements, dealNotes] = await Promise.all([
      contactId ? fetchEngagements(contactId) : Promise.resolve([] as Engagement[]),
      fetchDealNotes(dealId),
    ]);

    // Step 5: Send to Grok for NLP tone analysis
    const grokResponse = await analyzeEngagementTone(engagements, dealNotes);
    const { toneScore, positiveCount, negativeCount, neutralCount, details } =
      buildToneSignalDetails(grokResponse);

    // Step 6: Compute all 4 signal scores
    const activityScore = computeActivityScore(engagements, ENGAGEMENT_WINDOW_DAYS);
    const milestoneScore = computeMilestoneScore(dealStage);
    const recencyScore = computeRecencyScore(engagements);

    // Determine most-recent engagement type for recency signal metadata
    const sortedByTime = [...engagements].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const lastEngagement = sortedByTime[0];
    const daysSinceLast =
      lastEngagement?.timestamp
        ? (Date.now() - new Date(lastEngagement.timestamp).getTime()) / (1000 * 60 * 60 * 24)
        : Infinity;

    const signals: SentimentSignals = {
      activity: {
        score: activityScore,
        count: engagements.length,
        window_days: ENGAGEMENT_WINDOW_DAYS,
      },
      tone: {
        score: toneScore,
        positive_count: positiveCount,
        negative_count: negativeCount,
        neutral_count: neutralCount,
        details,
      },
      milestone: {
        score: milestoneScore,
        stage: dealStage,
        stage_number: milestoneScore >= 85 ? 7 : milestoneScore >= 70 ? 6 : milestoneScore >= 50 ? 5 : 0,
      },
      recency: {
        score: recencyScore,
        days_since_last: isFinite(daysSinceLast) ? Math.round(daysSinceLast * 10) / 10 : -1,
        last_activity_type: lastEngagement?.type ?? 'none',
      },
    };

    // Raw composite before smoothing
    const rawComposite = computeCompositeScore(activityScore, toneScore, milestoneScore, recencyScore);

    // Step 7: Fetch previous score and apply EMA if available
    const previous = await fetchPreviousScore(dealId);
    let finalComposite = rawComposite;

    if (previous) {
      finalComposite = applyEMA(rawComposite, previous.composite_score);
    }

    // Step 8: Apply downgrade guard
    let finalTier = getTier(finalComposite);

    if (previous) {
      const previousTier = getTier(previous.composite_score);
      const tierOrder: Record<string, number> = {
        'Advocate': 5, 'Positive': 4, 'Neutral': 3, 'At Risk': 2, 'High Risk': 1,
      };
      const isDowngradingTier = (tierOrder[finalTier] ?? 0) < (tierOrder[previousTier] ?? 0);

      if (isDowngradingTier) {
        const downgradeAllowed = shouldDowngrade(finalComposite, previous.composite_score, {
          activity:  { current: activityScore,  previous: previous.activity_score },
          tone:      { current: toneScore,       previous: previous.tone_score },
          milestone: { current: milestoneScore,  previous: previous.milestone_score },
          recency:   { current: recencyScore,    previous: previous.recency_score },
        });

        if (!downgradeAllowed) {
          // Hold the previous tier by clamping the score to the previous tier's minimum
          finalTier = previousTier;
          // Keep finalComposite as-is (EMA-smoothed) but override the tier label
        }
      }
    }

    // Rebuild signals with final scores (tone score came from Grok, others are computed)
    signals.activity.score  = activityScore;
    signals.tone.score      = toneScore;
    signals.milestone.score = milestoneScore;
    signals.recency.score   = recencyScore;

    // Build the canonical result object
    const sentimentResult = buildSentimentResult(
      activityScore,
      toneScore,
      milestoneScore,
      recencyScore,
      signals,
      engagements
    );

    // Override composite and tier with the EMA-smoothed + guard-applied values
    const finalResult = {
      ...sentimentResult,
      composite_score: finalComposite,
      tier: finalTier,
    };

    // Steps 9 & 10: Persist to database (best-effort — don't fail the response)
    try {
      await Promise.all([
        upsertSentimentScore({
          dealId,
          dealName,
          contactId,
          compositeScore: finalComposite,
          activityScore,
          toneScore,
          milestoneScore,
          recencyScore,
          tier: finalTier,
          dealStage,
          engagementsAnalyzed: engagements.length,
          signals,
        }),
        appendSentimentHistory({
          dealId,
          compositeScore: finalComposite,
          activityScore,
          toneScore,
          milestoneScore,
          recencyScore,
          tier: finalTier,
          engagementsAnalyzed: engagements.length,
        }),
      ]);
    } catch (dbErr) {
      console.error('[sentiment/score] DB write failed (non-fatal):', dbErr);
    }

    // Step 11: Return result
    return NextResponse.json({
      ...finalResult,
      deal_id: dealId,
      deal_name: dealName,
      deal_stage: dealStage,
      contact_id: contactId,
    });
  } catch (err) {
    console.error('[sentiment/score]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
