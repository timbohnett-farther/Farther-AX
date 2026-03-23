import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`
      -- ═══════════════════════════════════════════════════════════════
      -- U4 & 2B Intake Form — Secure link tokens
      -- ═══════════════════════════════════════════════════════════════
      CREATE TABLE IF NOT EXISTS u4_2b_tokens (
        id            SERIAL PRIMARY KEY,
        deal_id       VARCHAR(64) NOT NULL,
        contact_id    VARCHAR(64),
        contact_email VARCHAR(255) NOT NULL,
        advisor_name  VARCHAR(255) NOT NULL,
        token         UUID NOT NULL DEFAULT gen_random_uuid(),
        status        VARCHAR(32) NOT NULL DEFAULT 'sent',
        sent_at       TIMESTAMPTZ DEFAULT NOW(),
        sent_by       VARCHAR(255),
        completed_at  TIMESTAMPTZ,
        expires_at    TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT u4_2b_tokens_token_unique UNIQUE(token)
      );

      CREATE INDEX IF NOT EXISTS idx_u4_2b_tokens_deal_id ON u4_2b_tokens(deal_id);
      CREATE INDEX IF NOT EXISTS idx_u4_2b_tokens_token ON u4_2b_tokens(token);
      CREATE INDEX IF NOT EXISTS idx_u4_2b_tokens_status ON u4_2b_tokens(status);

      -- ═══════════════════════════════════════════════════════════════
      -- U4 & 2B Intake Form — Submission data
      -- ═══════════════════════════════════════════════════════════════
      CREATE TABLE IF NOT EXISTS u4_2b_submissions (
        id                          SERIAL PRIMARY KEY,
        token_id                    INTEGER NOT NULL REFERENCES u4_2b_tokens(id),
        deal_id                     VARCHAR(64) NOT NULL,

        -- Section 1: General Information
        full_name                   VARCHAR(512),
        business_address            TEXT,
        other_jurisdictions         TEXT,
        texas_clients               BOOLEAN,
        start_date                  VARCHAR(64),
        position_title              VARCHAR(255),
        independent_contractor      BOOLEAN,

        -- Section 2: Personal Information
        personal_email              VARCHAR(255),
        date_of_birth               VARCHAR(32),
        state_of_birth              VARCHAR(128),
        height_ft                   INTEGER,
        height_in                   INTEGER,
        weight                      INTEGER,
        sex                         VARCHAR(32),
        hair_color                  VARCHAR(64),
        eye_color                   VARCHAR(64),
        ssn                         VARCHAR(512),
        crd_number                  VARCHAR(64),
        series_65_registered        BOOLEAN,

        -- Section 3: Qualifications & Licensing
        iar_qualifications          JSONB,
        series_65_exam_date         VARCHAR(32),
        other_designations          TEXT,
        designations_confirmed      BOOLEAN,
        designations_comments       TEXT,
        insurance_licensed          BOOLEAN,
        insurance_date              VARCHAR(32),
        insurance_type              VARCHAR(255),
        agency_name                 VARCHAR(255),
        agency_address              TEXT,
        insurance_hours_month       VARCHAR(64),
        insurance_trading_hours     VARCHAR(255),
        is_cpa                      BOOLEAN,
        cpa_year                    VARCHAR(16),
        cpa_confirmed               BOOLEAN,
        education                   JSONB,

        -- Section 4: Employment & Disclosures
        other_business_activities   JSONB,
        employment_history          JSONB,
        residential_history         JSONB,
        disclosures                 JSONB,
        income_new_client           BOOLEAN,
        compensation_asset_based    BOOLEAN,

        -- Meta
        submitted_at                TIMESTAMPTZ DEFAULT NOW(),
        ip_address                  VARCHAR(64)
      );

      CREATE INDEX IF NOT EXISTS idx_u4_2b_submissions_token_id ON u4_2b_submissions(token_id);
      CREATE INDEX IF NOT EXISTS idx_u4_2b_submissions_deal_id ON u4_2b_submissions(deal_id);
    `);
    console.log('U4 & 2B migration complete — tables created.');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);
