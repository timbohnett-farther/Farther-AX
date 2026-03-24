// Run with: npx tsx scripts/migrate-intake.ts
// Creates the intake_forms and onboarding_tasks tables

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating intake_forms table...');

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS intake_forms (
      id            SERIAL PRIMARY KEY,
      token         VARCHAR(64) NOT NULL UNIQUE,
      deal_id       VARCHAR(64) NOT NULL,
      contact_id    VARCHAR(64),
      advisor_name  VARCHAR(255),
      advisor_email VARCHAR(255),
      status        VARCHAR(32) NOT NULL DEFAULT 'pending',
      form_data     JSONB,
      sent_by       VARCHAR(255),
      sent_at       TIMESTAMPTZ DEFAULT NOW(),
      started_at    TIMESTAMPTZ,
      completed_at  TIMESTAMPTZ,
      expires_at    TIMESTAMPTZ NOT NULL,
      pdf_url       TEXT,
      hubspot_note_id VARCHAR(64),
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      updated_at    TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_intake_forms_token ON intake_forms(token);
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_intake_forms_deal_id ON intake_forms(deal_id);
  `);

  console.log('intake_forms table created.');

  console.log('Creating onboarding_tasks table...');

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS onboarding_tasks (
      id            SERIAL PRIMARY KEY,
      deal_id       VARCHAR(64) NOT NULL,
      task_key      VARCHAR(128) NOT NULL,
      phase         VARCHAR(64) NOT NULL DEFAULT 'pre_launch',
      completed     BOOLEAN NOT NULL DEFAULT false,
      completed_by  VARCHAR(255),
      completed_at  TIMESTAMPTZ,
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      updated_at    TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(deal_id, task_key)
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_deal ON onboarding_tasks(deal_id);
  `);

  console.log('onboarding_tasks table created.');
  console.log('Migration complete.');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
