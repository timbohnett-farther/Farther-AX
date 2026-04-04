/**
 * app/api/command-center/sentiment/scores/route.ts
 *
 * GET /api/command-center/sentiment/scores
 *
 * Returns all stored sentiment scores from the advisor_sentiment table,
 * ordered by deal_name. Used by the Advisor Hub to display scores
 * without re-computing.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withPgCache } from '@/lib/pg-cache';

export const dynamic = 'force-dynamic';

interface AdvisorSentimentRow {
  deal_id: string;
  deal_name: string;
  contact_id: string | null;
  composite_score: number;
  activity_score: number;
  tone_score: number;
  milestone_score: number;
  recency_score: number;
  tier: string;
  deal_stage: string;
  engagements_analyzed: number;
  signals: Record<string, unknown>;
  updated_at: string;
}

export async function GET() {
  try {
    const result = await withPgCache(
      'sentiment-scores',
      async () => {
        const rows = await prisma.$queryRaw<AdvisorSentimentRow[]>`
          SELECT
            deal_id,
            deal_name,
            contact_id,
            composite_score,
            activity_score,
            tone_score,
            milestone_score,
            recency_score,
            tier,
            deal_stage,
            engagements_analyzed,
            signals,
            updated_at
          FROM advisor_sentiment
          ORDER BY deal_name ASC
        `;
        return { scores: rows, count: rows.length };
      },
      { ttlMs: 30 * 60 * 1000 } // 30 minutes
    );

    return NextResponse.json(result.data);
  } catch (err) {
    console.error('[sentiment/scores]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
