import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { QUIZ_BANK } from '@/lib/quiz-questions';

export const dynamic = 'force-dynamic';

const PASSING_SCORE = 9;
const MAX_ATTEMPTS = 2;
const QUESTIONS_PER_QUIZ = 10;

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
  await pool.query(CREATE_TABLE_SQL);
}

/** Fisher-Yates shuffle, return first n items */
function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

// ---------------------------------------------------------------------------
// GET  /api/quiz?topic=introduction&userEmail=user@farther.com
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const topic = searchParams.get('topic');
    const userEmail = searchParams.get('userEmail');

    if (!topic || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required query params: topic, userEmail' },
        { status: 400 },
      );
    }

    const questionBank = QUIZ_BANK[topic];
    if (!questionBank || questionBank.length === 0) {
      return NextResponse.json(
        { error: `No questions found for topic: ${topic}` },
        { status: 404 },
      );
    }

    await ensureTable();

    // Fetch previous attempts
    const { rows: attempts } = await pool.query(
      `SELECT attempt_number AS attempt, score, total_questions AS total, passed, completed_at AS "completedAt"
         FROM quiz_attempts
        WHERE user_email = $1 AND topic_slug = $2
        ORDER BY attempt_number ASC`,
      [userEmail, topic],
    );

    const canTake = attempts.length < MAX_ATTEMPTS && !attempts.some((a: { passed: boolean }) => a.passed);

    // Pick 10 random questions, strip answers
    const selected = pickRandom(questionBank, QUESTIONS_PER_QUIZ);
    const questions = selected.map(({ id, question, options }) => ({
      id,
      question,
      options,
    }));

    return NextResponse.json({ questions, canTake, attempts });
  } catch (err: unknown) {
    console.error('[GET /api/quiz]', err);
    return NextResponse.json({ error: 'Failed to fetch quiz questions' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST  /api/quiz
// Body: { topic, userEmail, userName?, answers: [{ questionId, selectedIndex }] }
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic, userEmail, userName, answers } = body as {
      topic: string;
      userEmail: string;
      userName?: string;
      answers: { questionId: string; selectedIndex: number }[];
    };

    if (!userEmail || !topic || !answers?.length) {
      return NextResponse.json(
        { error: 'Missing required fields: topic, userEmail, answers' },
        { status: 400 },
      );
    }

    const questionBank = QUIZ_BANK[topic];
    if (!questionBank) {
      return NextResponse.json(
        { error: `No questions found for topic: ${topic}` },
        { status: 404 },
      );
    }

    await ensureTable();

    // Check existing attempts
    const { rows: existing } = await pool.query(
      `SELECT attempt_number, passed FROM quiz_attempts
        WHERE user_email = $1 AND topic_slug = $2
        ORDER BY attempt_number ASC`,
      [userEmail, topic],
    );

    if (existing.length >= MAX_ATTEMPTS) {
      return NextResponse.json({ error: 'Maximum attempts reached' }, { status: 403 });
    }
    if (existing.some((r: { passed: boolean }) => r.passed)) {
      return NextResponse.json({ error: 'Already passed this quiz' }, { status: 403 });
    }

    const attemptNumber = existing.length + 1;

    // Build lookup for grading
    const bankMap = new Map(questionBank.map(q => [q.id, q]));

    let score = 0;
    const results = answers.map(({ questionId, selectedIndex }) => {
      const q = bankMap.get(questionId);
      if (!q) {
        return { questionId, selectedIndex, correctIndex: -1, correct: false, explanation: '' };
      }
      const correct = selectedIndex === q.correctIndex;
      if (correct) score++;
      return {
        questionId,
        selectedIndex,
        correctIndex: q.correctIndex,
        correct,
        explanation: q.explanation,
      };
    });

    const total = answers.length;
    const passed = score >= PASSING_SCORE;

    // Persist
    const questionIds = answers.map(a => a.questionId);
    const answerIndices = answers.map(a => a.selectedIndex);

    await pool.query(
      `INSERT INTO quiz_attempts
         (user_email, user_name, topic_slug, attempt_number, score, total_questions, passed, questions_json, answers_json)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [userEmail, userName || null, topic, attemptNumber, score, total, passed,
       JSON.stringify(questionIds), JSON.stringify(answerIndices)],
    );

    return NextResponse.json({ score, total, passed, attempt: attemptNumber, answers: results });
  } catch (err: unknown) {
    console.error('[POST /api/quiz]', err);
    return NextResponse.json({ error: 'Failed to submit quiz' }, { status: 500 });
  }
}
