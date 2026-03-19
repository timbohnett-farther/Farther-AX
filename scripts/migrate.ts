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
    `);
    console.log('Migration complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);
