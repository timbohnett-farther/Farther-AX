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
      -- Technology Intake Form — Secure link tokens
      -- ═══════════════════════════════════════════════════════════════
      CREATE TABLE IF NOT EXISTS tech_intake_tokens (
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
        CONSTRAINT tech_intake_tokens_token_unique UNIQUE(token)
      );

      CREATE INDEX IF NOT EXISTS idx_tech_intake_tokens_deal_id ON tech_intake_tokens(deal_id);
      CREATE INDEX IF NOT EXISTS idx_tech_intake_tokens_token ON tech_intake_tokens(token);
      CREATE INDEX IF NOT EXISTS idx_tech_intake_tokens_status ON tech_intake_tokens(status);

      -- ═══════════════════════════════════════════════════════════════
      -- Technology Intake Form — Submission data
      -- ═══════════════════════════════════════════════════════════════
      CREATE TABLE IF NOT EXISTS tech_intake_submissions (
        id                      SERIAL PRIMARY KEY,
        token_id                INTEGER NOT NULL REFERENCES tech_intake_tokens(id),
        deal_id                 VARCHAR(64) NOT NULL,

        -- Laptop & Monitor
        laptop_choice           VARCHAR(64),
        has_monitors            BOOLEAN,

        -- Shipping
        ship_to                 VARCHAR(32),
        shipping_street         VARCHAR(512),
        shipping_city           VARCHAR(128),
        shipping_state          VARCHAR(64),
        shipping_zip            VARCHAR(20),
        phone                   VARCHAR(32),

        -- Travel / Availability
        travel_dates            TEXT,

        -- Office & IT
        has_commercial_office   BOOLEAN,
        has_it_vendor           BOOLEAN,
        it_vendor_company       VARCHAR(255),
        it_vendor_contact       VARCHAR(255),
        it_vendor_phone         VARCHAR(64),
        it_vendor_email         VARCHAR(255),

        -- Software & Domains
        software_suite          VARCHAR(255),
        has_domain              BOOLEAN,
        domain_names            TEXT,

        -- Launch
        launch_date             VARCHAR(64),

        -- Meta
        submitted_at            TIMESTAMPTZ DEFAULT NOW(),
        ip_address              VARCHAR(64)
      );

      CREATE INDEX IF NOT EXISTS idx_tech_intake_submissions_token_id ON tech_intake_submissions(token_id);
      CREATE INDEX IF NOT EXISTS idx_tech_intake_submissions_deal_id ON tech_intake_submissions(deal_id);
    `);
    console.log('Tech Intake migration complete — tables created.');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);
