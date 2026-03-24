import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS onboarding_tasks (
        id          SERIAL PRIMARY KEY,
        deal_id     VARCHAR(64) NOT NULL,
        task_key    VARCHAR(128) NOT NULL,
        phase       VARCHAR(32) NOT NULL,
        completed   BOOLEAN NOT NULL DEFAULT FALSE,
        completed_by VARCHAR(255),
        completed_at TIMESTAMPTZ,
        notes       TEXT,
        due_date    DATE,
        is_legacy   BOOLEAN DEFAULT FALSE,
        updated_at  TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT onboarding_tasks_deal_task_unique UNIQUE(deal_id, task_key)
      );

      CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_deal_id
        ON onboarding_tasks(deal_id);

      CREATE TABLE IF NOT EXISTS team_members (
        id          SERIAL PRIMARY KEY,
        name        VARCHAR(255) NOT NULL,
        email       VARCHAR(255) NOT NULL UNIQUE,
        role        VARCHAR(64) NOT NULL,
        phone       VARCHAR(32),
        calendar_link VARCHAR(512),
        active      BOOLEAN NOT NULL DEFAULT TRUE,
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_team_members_role
        ON team_members(role);
      CREATE INDEX IF NOT EXISTS idx_team_members_active
        ON team_members(active);

      CREATE TABLE IF NOT EXISTS advisor_assignments (
        id          SERIAL PRIMARY KEY,
        deal_id     VARCHAR(64) NOT NULL,
        role        VARCHAR(64) NOT NULL,
        member_id   INTEGER NOT NULL REFERENCES team_members(id),
        assigned_at TIMESTAMPTZ DEFAULT NOW(),
        assigned_by VARCHAR(255),
        CONSTRAINT advisor_assignments_deal_role_unique UNIQUE(deal_id, role)
      );

      CREATE INDEX IF NOT EXISTS idx_advisor_assignments_deal_id
        ON advisor_assignments(deal_id);
      CREATE INDEX IF NOT EXISTS idx_advisor_assignments_member_id
        ON advisor_assignments(member_id);

      CREATE TABLE IF NOT EXISTS advisor_drive_links (
        id          SERIAL PRIMARY KEY,
        deal_id     VARCHAR(64) NOT NULL UNIQUE,
        folder_url  TEXT NOT NULL,
        folder_name VARCHAR(255) DEFAULT 'Advisor Folder',
        updated_by  VARCHAR(255),
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_advisor_drive_links_deal_id
        ON advisor_drive_links(deal_id);

      -- HubSpot API cache table (persistent across redeploys)
      CREATE TABLE IF NOT EXISTS api_cache (
        cache_key   VARCHAR(255) PRIMARY KEY,
        data        JSONB NOT NULL,
        expires_at  TIMESTAMPTZ NOT NULL,
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_api_cache_expires_at
        ON api_cache(expires_at);

      -- Advisor sentiment scores (computed data cache)
      CREATE TABLE IF NOT EXISTS advisor_sentiment (
        deal_id         VARCHAR(64) PRIMARY KEY,
        deal_name       VARCHAR(255),
        composite_score DECIMAL(5,2) NOT NULL,
        tier            VARCHAR(32) NOT NULL,
        activity_score  DECIMAL(5,2),
        tone_score      DECIMAL(5,2),
        milestone_score DECIMAL(5,2),
        recency_score   DECIMAL(5,2),
        computed_at     TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_advisor_sentiment_tier
        ON advisor_sentiment(tier);
      CREATE INDEX IF NOT EXISTS idx_advisor_sentiment_computed_at
        ON advisor_sentiment(computed_at);

      -- Sentiment history (for tracking changes over time)
      CREATE TABLE IF NOT EXISTS advisor_sentiment_history (
        id              SERIAL PRIMARY KEY,
        deal_id         VARCHAR(64) NOT NULL,
        composite_score DECIMAL(5,2) NOT NULL,
        tier            VARCHAR(32) NOT NULL,
        scored_at       TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_advisor_sentiment_history_deal_id
        ON advisor_sentiment_history(deal_id);
      CREATE INDEX IF NOT EXISTS idx_advisor_sentiment_history_scored_at
        ON advisor_sentiment_history(scored_at);
    `);
    console.log('Migration complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);
