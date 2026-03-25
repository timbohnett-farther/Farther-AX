import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`
      -- Persistent DocuSign envelope storage
      CREATE TABLE IF NOT EXISTS docusign_envelopes (
        id SERIAL PRIMARY KEY,
        envelope_id VARCHAR(64) UNIQUE NOT NULL,
        status VARCHAR(32) NOT NULL,
        email_subject TEXT,
        sent_date_time TIMESTAMPTZ,
        completed_date_time TIMESTAMPTZ,
        status_changed_at TIMESTAMPTZ,
        envelope_type VARCHAR(32),
        matched_advisor_name VARCHAR(255),
        match_method VARCHAR(32),
        raw_json JSONB,
        first_seen_at TIMESTAMPTZ DEFAULT NOW(),
        last_synced_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_docusign_envelopes_status ON docusign_envelopes(status);
      CREATE INDEX IF NOT EXISTS idx_docusign_envelopes_advisor ON docusign_envelopes(matched_advisor_name);
      CREATE INDEX IF NOT EXISTS idx_docusign_envelopes_type ON docusign_envelopes(envelope_type);
      CREATE INDEX IF NOT EXISTS idx_docusign_envelopes_sent ON docusign_envelopes(sent_date_time);

      -- Per-signer status tracking
      CREATE TABLE IF NOT EXISTS docusign_signers (
        id SERIAL PRIMARY KEY,
        envelope_id VARCHAR(64) NOT NULL,
        signer_name VARCHAR(255),
        signer_email VARCHAR(255),
        status VARCHAR(32),
        signed_date_time TIMESTAMPTZ,
        delivered_date_time TIMESTAMPTZ,
        sent_date_time TIMESTAMPTZ,
        client_id INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_docusign_signers_envelope ON docusign_signers(envelope_id);
      CREATE INDEX IF NOT EXISTS idx_docusign_signers_email ON docusign_signers(signer_email);

      -- JSONB snapshots for change detection
      CREATE TABLE IF NOT EXISTS docusign_sync_snapshots (
        id SERIAL PRIMARY KEY,
        snapshot_type VARCHAR(32) NOT NULL,
        snapshot_data JSONB NOT NULL,
        advisor_count INTEGER,
        envelope_count INTEGER,
        household_count INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_sync_snapshots_type ON docusign_sync_snapshots(snapshot_type);

      -- Audit trail for change detection
      CREATE TABLE IF NOT EXISTS docusign_change_log (
        id SERIAL PRIMARY KEY,
        change_type VARCHAR(32) NOT NULL,
        entity_type VARCHAR(32) NOT NULL,
        entity_id VARCHAR(128),
        advisor_name VARCHAR(255),
        old_value VARCHAR(255),
        new_value VARCHAR(255),
        details JSONB,
        detected_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_change_log_type ON docusign_change_log(change_type);
      CREATE INDEX IF NOT EXISTS idx_change_log_advisor ON docusign_change_log(advisor_name);
      CREATE INDEX IF NOT EXISTS idx_change_log_detected ON docusign_change_log(detected_at DESC);

      -- Add columns to transition_workbooks
      ALTER TABLE transition_workbooks ADD COLUMN IF NOT EXISTS drive_modified_at TIMESTAMPTZ;
      ALTER TABLE transition_workbooks ADD COLUMN IF NOT EXISTS is_stale BOOLEAN DEFAULT FALSE;
      ALTER TABLE transition_workbooks ADD COLUMN IF NOT EXISTS skip_reason VARCHAR(128);

      -- Add computed status columns to transition_clients
      ALTER TABLE transition_clients ADD COLUMN IF NOT EXISTS household_status VARCHAR(64);
      ALTER TABLE transition_clients ADD COLUMN IF NOT EXISTS completion_pct SMALLINT DEFAULT 0;
    `);
    console.log('DocuSign migration complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);
