import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`
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
        primary_middle_name VARCHAR(255),
        primary_last_name VARCHAR(255),
        primary_email VARCHAR(255),
        primary_phone VARCHAR(64),
        primary_dob VARCHAR(32),
        primary_ssn_last4 VARCHAR(4),
        primary_street VARCHAR(512),
        primary_city VARCHAR(128),
        primary_state VARCHAR(64),
        primary_zip VARCHAR(16),
        primary_country VARCHAR(64),
        secondary_first_name VARCHAR(255),
        secondary_middle_name VARCHAR(255),
        secondary_last_name VARCHAR(255),
        secondary_email VARCHAR(255),
        secondary_phone VARCHAR(64),
        secondary_dob VARCHAR(32),
        secondary_ssn_last4 VARCHAR(4),
        secondary_street VARCHAR(512),
        secondary_city VARCHAR(128),
        secondary_state VARCHAR(64),
        secondary_zip VARCHAR(16),
        secondary_country VARCHAR(64),
        fee_schedule VARCHAR(128),
        billing_exceptions VARCHAR(64),
        billing_exception_explanation TEXT,
        contra_account_firm VARCHAR(255),
        contra_account_numbers TEXT,
        new_account_number VARCHAR(128),
        account_type VARCHAR(128),
        account_name VARCHAR(255),
        mailing_street VARCHAR(512),
        mailing_city VARCHAR(128),
        mailing_state VARCHAR(64),
        mailing_zip VARCHAR(16),
        mailing_country VARCHAR(64),
        portal_invites VARCHAR(64),
        welcome_gift_box VARCHAR(64),
        notes TEXT,
        billing_setup VARCHAR(255),
        docusign_iaa_envelope_id VARCHAR(128),
        docusign_paperwork_envelope_id VARCHAR(128),
        docusign_iaa_status VARCHAR(64),
        docusign_paperwork_status VARCHAR(64),
        docusign_last_checked TIMESTAMPTZ,
        sheet_id VARCHAR(255),
        sheet_row_index INTEGER,
        synced_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_transition_clients_advisor_name
        ON transition_clients(advisor_name);

      CREATE INDEX IF NOT EXISTS idx_transition_clients_primary_email
        ON transition_clients(primary_email);

      CREATE INDEX IF NOT EXISTS idx_transition_clients_household_name
        ON transition_clients(household_name);

      CREATE UNIQUE INDEX IF NOT EXISTS idx_transition_clients_sheet_id_row
        ON transition_clients(sheet_id, sheet_row_index);

      -- Added: track which Drive workbook each row came from
      ALTER TABLE transition_clients
        ADD COLUMN IF NOT EXISTS workbook_name VARCHAR(512);

      -- Workbook-to-advisor mapping (manual assignment, locking)
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
      -- Used to normalize Transition sheet data where individuals appear instead of team names
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

      -- Advisor TRAN AUM & Revenue (aggregated from HubSpot custom object 2-13676628)
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
    console.log('Migration complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);
