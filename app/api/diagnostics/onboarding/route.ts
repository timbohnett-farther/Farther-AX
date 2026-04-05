/**
 * GET /api/diagnostics/onboarding
 *
 * No-auth diagnostic that tests every endpoint the onboarding page depends on.
 * Deploy, hit the URL, see exactly what's broken. Remove when done.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET() {
  const results: Record<string, unknown> = {};

  // 0. Show which database we're connected to
  try {
    const dbUrl = process.env.DATABASE_URL ?? '';
    // Only show host:port/dbname for security — no password
    const match = dbUrl.match(/@([^/]+)\/([^?]+)/);
    results.database_target = { host: match?.[1] ?? 'unknown', db: match?.[2] ?? 'unknown' };
  } catch {
    results.database_target = { error: 'Could not parse DATABASE_URL' };
  }

  // 0b. List all tables in this database
  try {
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
    `;
    results.existing_tables = { ok: true, count: tables.length, tables: tables.map(t => t.tablename) };
  } catch (err) {
    results.existing_tables = { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  // 1. Test team_members table
  try {
    const members = await prisma.$queryRaw<Array<{ id: number; name: string; role: string }>>`
      SELECT id, name, role FROM team_members WHERE active = TRUE ORDER BY role, name LIMIT 10
    `;
    results.team_members = { ok: true, count: members.length, sample: members.slice(0, 3) };
  } catch (err) {
    results.team_members = { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  // 2. Test advisor_assignments table
  try {
    const assignments = await prisma.$queryRaw<Array<{ deal_id: string; member_id: number; role: string }>>`
      SELECT deal_id, member_id, role FROM advisor_assignments LIMIT 10
    `;
    results.advisor_assignments = { ok: true, count: assignments.length };
  } catch (err) {
    results.advisor_assignments = { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  // 3. Test onboarding_tasks table
  try {
    const tasks = await prisma.$queryRaw<Array<{ deal_id: string; task_key: string }>>`
      SELECT deal_id, task_key FROM onboarding_tasks LIMIT 10
    `;
    results.onboarding_tasks = { ok: true, count: tasks.length };
  } catch (err) {
    results.onboarding_tasks = { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  // 4. Test workload API logic (the actual code path)
  try {
    const role = 'AXM';
    const members = await prisma.$queryRaw<Array<{ id: number; name: string; role: string }>>`
      SELECT * FROM team_members WHERE active = TRUE AND role = ${role} ORDER BY name
    `;

    if (members.length === 0) {
      results.workload_flow = { ok: true, message: 'No active AXM team members found (empty workload is valid)', members: 0 };
    } else {
      const memberIds = members.map(m => m.id);
      const assignments = await prisma.$queryRaw<Array<{ deal_id: string; member_id: number; role: string }>>`
        SELECT a.deal_id, a.member_id, a.role
        FROM advisor_assignments a
        WHERE a.member_id = ANY(ARRAY[${Prisma.join(memberIds)}]::int[])
      `;

      // This is where the old code crashed (.rows.map)
      const dealIds = Array.from(new Set(assignments.map(a => a.deal_id)));

      results.workload_flow = {
        ok: true,
        members: members.length,
        assignments: assignments.length,
        uniqueDeals: dealIds.length,
        memberNames: members.map(m => m.name),
      };
    }
  } catch (err) {
    results.workload_flow = { ok: false, error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack?.split('\n').slice(0, 5) : undefined };
  }

  // 5. Test pipeline endpoint (what the page fetches first)
  try {
    const hubspotToken = process.env.HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_PAT;
    results.hubspot_config = { ok: !!hubspotToken, tokenLength: hubspotToken?.length ?? 0 };
  } catch (err) {
    results.hubspot_config = { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  // 6. Test TASKS import
  try {
    const { TASKS } = await import('@/lib/onboarding-tasks-v2');
    results.tasks_v2_import = { ok: true, count: TASKS?.length ?? 0, isArray: Array.isArray(TASKS) };
  } catch (err) {
    results.tasks_v2_import = { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  // 7. Test Prisma schema recognition of new models
  try {
    // Check if Prisma client has the new models
    const hasTransitionClient = typeof prisma.transitionClient !== 'undefined';
    const hasAdvisorGraduations = typeof prisma.advisor_graduations !== 'undefined';
    results.prisma_models = {
      ok: true,
      transitionClient: hasTransitionClient,
      advisor_graduations: hasAdvisorGraduations,
    };
  } catch (err) {
    results.prisma_models = { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  const allOk = Object.values(results).every((r: any) => r.ok === true);

  return NextResponse.json({
    status: allOk ? 'all_green' : 'issues_found',
    timestamp: new Date().toISOString(),
    results,
  });
}

/**
 * POST /api/diagnostics/onboarding
 *
 * Creates ALL missing tables needed for the onboarding system.
 * Uses the app's own Prisma connection so it hits the correct database.
 */
export async function POST() {
  const results: string[] = [];

  try {
    await prisma.$executeRawUnsafe(`
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
      )
    `);
    results.push('onboarding_tasks: created');

    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_deal_id ON onboarding_tasks(deal_id)`);

    await prisma.$executeRawUnsafe(`
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
      )
    `);
    results.push('team_members: created');

    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_team_members_role ON team_members(role)`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_team_members_active ON team_members(active)`);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS advisor_assignments (
        id          SERIAL PRIMARY KEY,
        deal_id     VARCHAR(64) NOT NULL,
        role        VARCHAR(64) NOT NULL,
        member_id   INTEGER NOT NULL REFERENCES team_members(id),
        assigned_at TIMESTAMPTZ DEFAULT NOW(),
        assigned_by VARCHAR(255),
        CONSTRAINT advisor_assignments_deal_role_unique UNIQUE(deal_id, role)
      )
    `);
    results.push('advisor_assignments: created');

    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_advisor_assignments_deal_id ON advisor_assignments(deal_id)`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_advisor_assignments_member_id ON advisor_assignments(member_id)`);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS advisor_drive_links (
        id          SERIAL PRIMARY KEY,
        deal_id     VARCHAR(64) NOT NULL UNIQUE,
        folder_url  TEXT NOT NULL,
        folder_name VARCHAR(255) DEFAULT 'Advisor Folder',
        updated_by  VARCHAR(255),
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    results.push('advisor_drive_links: created');

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS api_cache (
        cache_key   VARCHAR(255) PRIMARY KEY,
        data        JSONB NOT NULL,
        expires_at  TIMESTAMPTZ NOT NULL,
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    results.push('api_cache: created');

    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_api_cache_expires_at ON api_cache(expires_at)`);

    await prisma.$executeRawUnsafe(`
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
      )
    `);
    results.push('advisor_sentiment: created');

    await prisma.$executeRawUnsafe(`
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
      )
    `);
    results.push('advisor_sentiment_history: created');

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS managed_accounts (
        id              SERIAL PRIMARY KEY,
        advisor_name    VARCHAR(255) NOT NULL,
        current_value   DECIMAL(18,2) DEFAULT 0,
        fee_rate_bps    DECIMAL(8,4) DEFAULT 0,
        monthly_fee_amount DECIMAL(14,2) DEFAULT 0,
        hubspot_object_id VARCHAR(64),
        synced_at       TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    results.push('managed_accounts: created');

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS managed_accounts_summary (
        advisor_name    VARCHAR(255) PRIMARY KEY,
        total_aum       DECIMAL(18,2) DEFAULT 0,
        total_monthly_revenue DECIMAL(14,2) DEFAULT 0,
        account_count   INTEGER DEFAULT 0,
        weighted_fee_bps DECIMAL(8,4) DEFAULT 0,
        synced_at       TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    results.push('managed_accounts_summary: created');

    await prisma.$executeRawUnsafe(`
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
      )
    `);
    results.push('quiz_attempts: created');

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS docusign_tokens (
        id SERIAL PRIMARY KEY,
        access_token TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    results.push('docusign_tokens: created');

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS docusign_envelopes (
        id SERIAL PRIMARY KEY,
        envelope_id VARCHAR(128) UNIQUE NOT NULL,
        status VARCHAR(64),
        email_subject TEXT,
        sent_date_time VARCHAR(64),
        completed_date_time VARCHAR(64),
        status_changed_at VARCHAR(64),
        envelope_type VARCHAR(32),
        matched_advisor_name VARCHAR(255),
        match_method VARCHAR(64),
        raw_json JSONB,
        last_synced_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    results.push('docusign_envelopes: created');

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS docusign_signers (
        id SERIAL PRIMARY KEY,
        envelope_id VARCHAR(128) NOT NULL,
        signer_name VARCHAR(255),
        signer_email VARCHAR(255),
        status VARCHAR(64),
        signed_date_time VARCHAR(64),
        delivered_date_time VARCHAR(64),
        sent_date_time VARCHAR(64),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    results.push('docusign_signers: created');

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS docusign_sync_state (
        id SERIAL PRIMARY KEY,
        last_synced_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    results.push('docusign_sync_state: created');

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS docusign_sync_snapshots (
        id SERIAL PRIMARY KEY,
        snapshot_type VARCHAR(64),
        snapshot_data JSONB,
        advisor_count INTEGER DEFAULT 0,
        envelope_count INTEGER DEFAULT 0,
        household_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    results.push('docusign_sync_snapshots: created');

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS advisor_graduations (
        deal_id VARCHAR(64) PRIMARY KEY,
        graduated_at TIMESTAMPTZ DEFAULT NOW(),
        graduated_by VARCHAR(255)
      )
    `);
    results.push('advisor_graduations: created');

    return NextResponse.json({ status: 'success', tables_created: results });
  } catch (err) {
    return NextResponse.json({
      status: 'error',
      tables_created: results,
      error: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
