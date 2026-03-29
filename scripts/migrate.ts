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

      -- Advisor sentiment scores (canonical definition — see also migrate-sentiment.ts)
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

      -- Sentiment history (for tracking changes over time)
      CREATE TABLE IF NOT EXISTS advisor_sentiment_history (
        id              SERIAL PRIMARY KEY,
        deal_id         VARCHAR(64) NOT NULL,
        composite_score NUMERIC(5,2) NOT NULL,
        tier            VARCHAR(32) NOT NULL,
        activity_score  NUMERIC(5,2),
        tone_score      NUMERIC(5,2),
        milestone_score NUMERIC(5,2),
        recency_score   NUMERIC(5,2),
        signal_summary  JSONB,
        scored_at       TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_sentiment_history_deal_id
        ON advisor_sentiment_history(deal_id);
      CREATE INDEX IF NOT EXISTS idx_sentiment_history_scored_at
        ON advisor_sentiment_history(scored_at);

      -- Managed accounts (synced from HubSpot custom object 2-13676628)
      CREATE TABLE IF NOT EXISTS managed_accounts (
        id              SERIAL PRIMARY KEY,
        advisor_name    VARCHAR(255) NOT NULL,
        current_value   DECIMAL(18,2) DEFAULT 0,
        fee_rate_bps    DECIMAL(8,4) DEFAULT 0,
        monthly_fee_amount DECIMAL(14,2) DEFAULT 0,
        hubspot_object_id VARCHAR(64),
        synced_at       TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_managed_accounts_advisor_name
        ON managed_accounts(advisor_name);

      -- Aggregated view per advisor (for pipeline table)
      CREATE TABLE IF NOT EXISTS managed_accounts_summary (
        advisor_name    VARCHAR(255) PRIMARY KEY,
        total_aum       DECIMAL(18,2) DEFAULT 0,
        total_monthly_revenue DECIMAL(14,2) DEFAULT 0,
        account_count   INTEGER DEFAULT 0,
        weighted_fee_bps DECIMAL(8,4) DEFAULT 0,
        synced_at       TIMESTAMPTZ DEFAULT NOW()
      );

      -- Training quiz attempts (tracks user quiz results)
      CREATE TABLE IF NOT EXISTS quiz_attempts (
        id              SERIAL PRIMARY KEY,
        user_email      VARCHAR(255) NOT NULL,
        user_name       VARCHAR(255),
        topic_slug      VARCHAR(128) NOT NULL,
        attempt_number  INTEGER NOT NULL DEFAULT 1,
        score           INTEGER NOT NULL,
        total_questions  INTEGER NOT NULL DEFAULT 10,
        passed          BOOLEAN NOT NULL DEFAULT FALSE,
        questions_json  JSONB NOT NULL,
        answers_json    JSONB NOT NULL,
        completed_at    TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT quiz_attempts_user_topic_attempt UNIQUE(user_email, topic_slug, attempt_number)
      );

      CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_email
        ON quiz_attempts(user_email);
      CREATE INDEX IF NOT EXISTS idx_quiz_attempts_topic
        ON quiz_attempts(topic_slug);
      CREATE INDEX IF NOT EXISTS idx_quiz_attempts_completed
        ON quiz_attempts(completed_at);
    `);
    console.log('Migration complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);
