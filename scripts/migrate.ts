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
    `);
    console.log('Migration complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);
