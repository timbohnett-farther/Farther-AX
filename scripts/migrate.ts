import { Pool } from 'pg';

// Validate required environment variables
if (!process.env.DATABASE_URL) {
  console.error('FATAL: DATABASE_URL environment variable is not set');
  console.error('Database migrations cannot proceed without a valid database connection');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 5,  // Reduced for Railway shared Postgres
  connectionTimeoutMillis: 5000,
});

async function migrate() {
  console.log('[migrate] Starting database migrations...');

  let client;
  try {
    client = await pool.connect();
    console.log('[migrate] Database connection established');
  } catch (err) {
    console.error('[migrate] Failed to connect to database:', err);
    console.error('[migrate] Please verify DATABASE_URL is correct');
    process.exit(1);
  }

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

      -- Transitions system tables
      CREATE TABLE IF NOT EXISTS transition_clients (
        id SERIAL PRIMARY KEY,
        advisor_name VARCHAR(255),
        farther_contact VARCHAR(255),
        custodian VARCHAR(255),
        document_readiness VARCHAR(128),
        status_of_iaa VARCHAR(128),
        status_of_account_paperwork VARCHAR(128),
        portal_status VARCHAR(128),
        household_name VARCHAR(255),
        billing_group VARCHAR(255),
        primary_first_name VARCHAR(255),
        primary_email VARCHAR(255),
        fee_schedule VARCHAR(128),
        new_account_number VARCHAR(128),
        account_type VARCHAR(128),
        sheet_id VARCHAR(255),
        sheet_row_index INTEGER,
        workbook_name VARCHAR(512),
        synced_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_transition_clients_advisor_name
        ON transition_clients(advisor_name);
      CREATE INDEX IF NOT EXISTS idx_transition_clients_primary_email
        ON transition_clients(primary_email);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_transition_clients_sheet_id_row
        ON transition_clients(sheet_id, sheet_row_index);

      CREATE TABLE IF NOT EXISTS transition_workbooks (
        id SERIAL PRIMARY KEY,
        sheet_id VARCHAR(255) UNIQUE NOT NULL,
        workbook_name VARCHAR(512),
        sheet_url TEXT,
        detected_advisor_name VARCHAR(255),
        assigned_advisor_name VARCHAR(255),
        hubspot_contact_id VARCHAR(128),
        is_locked BOOLEAN DEFAULT FALSE,
        last_synced_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS docusign_tokens (
        id SERIAL PRIMARY KEY,
        access_token TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Advisor Team Mappings (individual advisor names → team names)
      CREATE TABLE IF NOT EXISTS advisor_team_mappings (
        id SERIAL PRIMARY KEY,
        individual_name VARCHAR(255) NOT NULL UNIQUE,
        team_name VARCHAR(255) NOT NULL,
        hubspot_contact_id VARCHAR(128),
        hubspot_deal_id VARCHAR(128),
        source VARCHAR(50) DEFAULT 'hubspot',
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_advisor_team_mappings_individual
        ON advisor_team_mappings(individual_name);
      CREATE INDEX IF NOT EXISTS idx_advisor_team_mappings_team
        ON advisor_team_mappings(team_name);
      CREATE INDEX IF NOT EXISTS idx_advisor_team_mappings_hubspot_deal
        ON advisor_team_mappings(hubspot_deal_id);

      -- Advisor TRAN AUM & Revenue
      CREATE TABLE IF NOT EXISTS advisor_tran_aum (
        id SERIAL PRIMARY KEY,
        advisor_name VARCHAR(255) NOT NULL UNIQUE,
        tran_aum NUMERIC(15, 2) DEFAULT 0,
        revenue NUMERIC(15, 2) DEFAULT 0,
        record_count INTEGER DEFAULT 0,
        last_synced_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_advisor_tran_aum_advisor_name
        ON advisor_tran_aum(advisor_name);
    `);
    console.log('[migrate] ✓ All tables and indexes created successfully');
    console.log('[migrate] Migration complete.');
  } catch (err) {
    console.error('[migrate] Migration failed:', err);
    console.error('[migrate] Rolling back any partial changes...');
    throw err;
  } finally {
    console.log('[migrate] Cleaning up database connection...');
    client.release();
    await pool.end();
    console.log('[migrate] Database connection closed.');
  }
}

migrate().catch(console.error);
