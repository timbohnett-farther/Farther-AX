import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS advisor_sentiment (
        id                  SERIAL PRIMARY KEY,
        deal_id             VARCHAR(64) NOT NULL UNIQUE,
        deal_name           VARCHAR(255),
        contact_id          VARCHAR(64),
        composite_score     NUMERIC(5,2) NOT NULL,
        tier                VARCHAR(32) NOT NULL,
        activity_score      NUMERIC(5,2),
        tone_score          NUMERIC(5,2),
        milestone_score     NUMERIC(5,2),
        recency_score       NUMERIC(5,2),
        deal_stage          VARCHAR(64),
        engagements_analyzed INTEGER DEFAULT 0,
        signals             JSONB,
        scored_at           TIMESTAMPTZ DEFAULT NOW(),
        updated_at          TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_advisor_sentiment_deal_id
        ON advisor_sentiment(deal_id);
      CREATE INDEX IF NOT EXISTS idx_advisor_sentiment_tier
        ON advisor_sentiment(tier);

      CREATE TABLE IF NOT EXISTS advisor_sentiment_history (
        id                  SERIAL PRIMARY KEY,
        deal_id             VARCHAR(64) NOT NULL,
        composite_score     NUMERIC(5,2) NOT NULL,
        tier                VARCHAR(32) NOT NULL,
        activity_score      NUMERIC(5,2),
        tone_score          NUMERIC(5,2),
        milestone_score     NUMERIC(5,2),
        recency_score       NUMERIC(5,2),
        signal_summary      JSONB,
        scored_at           TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_sentiment_history_deal_id
        ON advisor_sentiment_history(deal_id);
      CREATE INDEX IF NOT EXISTS idx_sentiment_history_scored_at
        ON advisor_sentiment_history(scored_at);
    `);
    console.log('Sentiment migration complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);
