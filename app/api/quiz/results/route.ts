import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS quiz_attempts (
    id              SERIAL PRIMARY KEY,
    user_email      VARCHAR(255) NOT NULL,
    user_name       VARCHAR(255),
    topic_slug      VARCHAR(128) NOT NULL,
    attempt_number  INTEGER NOT NULL DEFAULT 1,
    score           INTEGER NOT NULL,
    total_questions INTEGER NOT NULL DEFAULT 10,
    passed          BOOLEAN NOT NULL DEFAULT FALSE,
    questions_json  JSONB NOT NULL,
    answers_json    JSONB NOT NULL,
    completed_at    TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT quiz_attempts_user_topic_attempt UNIQUE(user_email, topic_slug, attempt_number)
  );
`;

async function ensureTable() {
  await prisma.$executeRawUnsafe(CREATE_TABLE_SQL);
}

// ---------------------------------------------------------------------------
// GET  /api/quiz/results?userEmail=user@farther.com&topic=introduction
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const userEmail = searchParams.get('userEmail');
    const topic = searchParams.get('topic');

    if (!userEmail) {
      return NextResponse.json(
        { error: 'Missing required query param: userEmail' },
        { status: 400 },
      );
    }

    await ensureTable();

    let rows: Array<{
      topic_slug: string;
      attempt_number: number;
      score: number;
      total_questions: number;
      passed: boolean;
      completed_at: Date;
    }>;

    if (topic) {
      rows = await prisma.$queryRaw`
        SELECT topic_slug, attempt_number, score, total_questions, passed, completed_at
        FROM quiz_attempts
        WHERE user_email = ${userEmail} AND topic_slug = ${topic}
        ORDER BY topic_slug ASC, attempt_number ASC
      `;
    } else {
      rows = await prisma.$queryRaw`
        SELECT topic_slug, attempt_number, score, total_questions, passed, completed_at
        FROM quiz_attempts
        WHERE user_email = ${userEmail}
        ORDER BY topic_slug ASC, attempt_number ASC
      `;
    }

    return NextResponse.json({ results: rows });
  } catch (err: unknown) {
    console.error('[GET /api/quiz/results] Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch quiz results' },
      { status: 500 },
    );
  }
}
