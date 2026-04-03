/**
 * Create advisor_profiles and advisor_activities tables
 *
 * Run this script to set up the tables needed by advisor-store.ts
 * These are separate from Prisma's advisors table
 */

import pool from '../lib/db';

async function createAdvisorTables() {
  const client = await pool.connect();

  try {
    console.log('Creating advisor store tables...');

    // Drop Prisma's conflicting tables if they exist
    await client.query(`
      DROP TABLE IF EXISTS advisor_activities CASCADE;
      DROP TABLE IF EXISTS advisors CASCADE;
    `);
    console.log('✓ Dropped Prisma advisor tables');

    // Create advisor_profiles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS advisor_profiles (
        deal_id            VARCHAR(64) PRIMARY KEY,
        deal_properties    JSONB NOT NULL DEFAULT '{}',
        contacts           JSONB NOT NULL DEFAULT '[]',
        team               JSONB,
        pinned_note        JSONB,
        last_synced_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✓ Created advisor_profiles table');

    // Create advisor_activities table
    await client.query(`
      CREATE TABLE IF NOT EXISTS advisor_activities (
        id                 SERIAL PRIMARY KEY,
        deal_id            VARCHAR(64) NOT NULL,
        activity_type      VARCHAR(32) NOT NULL,
        hubspot_id         VARCHAR(64) NOT NULL,
        activity_timestamp TIMESTAMPTZ,
        properties         JSONB NOT NULL DEFAULT '{}',
        created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(deal_id, hubspot_id)
      );

      CREATE INDEX IF NOT EXISTS idx_advisor_activities_deal
        ON advisor_activities(deal_id);
      CREATE INDEX IF NOT EXISTS idx_advisor_activities_timestamp
        ON advisor_activities(deal_id, activity_timestamp DESC);
    `);
    console.log('✓ Created advisor_activities table with indexes');

    console.log('\n✅ All advisor store tables created successfully!');
  } catch (error) {
    console.error('❌ Error creating advisor tables:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createAdvisorTables()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
