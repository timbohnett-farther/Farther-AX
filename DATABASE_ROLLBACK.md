# Database Rollback Procedures

## Overview

This document describes the procedures for safely rolling back database changes in the Farther AX Command Center. The project uses PostgreSQL on Railway with custom TypeScript migration scripts.

---

## Migration System Architecture

**Migration Approach**: Idempotent SQL migrations via TypeScript scripts
- **Primary Script**: `scripts/migrate.ts`
- **Table-Specific Scripts**: `migrate-*.ts` files for domain-specific tables
- **DDL Pattern**: All migrations use `CREATE TABLE IF NOT EXISTS` for idempotency
- **Execution**: Migrations run automatically on Railway deploy via `railway.json` build command

**Database Tables**:
1. `onboarding_tasks` — Advisor onboarding checklist items
2. `team_members` — AX team members and assignments
3. `advisor_assignments` — Advisor-to-team-member mappings
4. `tech_intake_forms` — Technology intake form submissions
5. `u4_2b_forms` — U4/2B compliance form submissions
6. `transitions_workbooks` — Client transition workbook metadata
7. `transitions_clients` — Client transition records
8. `docusign_webhooks` — DocuSign webhook event log
9. `advisory_sentiment` — Advisor sentiment tracking
10. `pg_cache` — Application-level query cache
11. `agent_scheduler_tasks` — Background job queue

---

## Pre-Rollback Checklist

Before rolling back any database changes:

1. **Identify the Bad Deploy**
   ```bash
   # Check Railway deployment logs
   railway logs --deployment <deployment_id>

   # Check GitHub commit history
   git log --oneline -10
   ```

2. **Determine Impact Scope**
   - Which tables were affected?
   - Were new columns added or removed?
   - Were data migrations run?
   - Are there dependent foreign keys?

3. **Backup Current State**
   ```bash
   # Connect to Railway database
   railway connect postgres

   # Or use pg_dump for full backup
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

4. **Notify Team**
   - Alert AX team that rollback is in progress
   - Estimate downtime window
   - Document reason for rollback

---

## Rollback Strategies

### Strategy 1: Code Rollback (Preferred)

**When to use**: Bad migration logic, incorrect data transformation, but schema is compatible

**Steps**:
1. Revert code to last known good commit:
   ```bash
   git log --oneline -10  # Find last good commit
   git revert <bad_commit_sha>  # Or git reset --hard <good_commit>
   git push origin main --force  # ⚠️ Use with caution
   ```

2. Railway auto-deploys the reverted code

3. Verify health:
   ```bash
   curl https://farther-ax.up.railway.app/api/health
   ```

**Pros**:
- Fast (no schema changes)
- Preserves data
- Railway auto-deploys

**Cons**:
- Only works if schema is compatible
- Doesn't fix corrupted data

---

### Strategy 2: Schema-Only Rollback

**When to use**: New column breaks app, but data is intact

**Steps**:
1. Connect to database:
   ```bash
   railway connect postgres
   ```

2. Drop problematic column (example):
   ```sql
   BEGIN;

   -- Remove column added in bad migration
   ALTER TABLE onboarding_tasks DROP COLUMN IF EXISTS bad_column;

   -- Verify tables still intact
   SELECT COUNT(*) FROM onboarding_tasks;

   COMMIT;
   ```

3. Verify app health:
   ```bash
   curl https://farther-ax.up.railway.app/api/command-center/pipeline
   ```

4. Commit schema fix:
   ```bash
   # Update scripts/migrate.ts to remove bad column
   git add scripts/migrate.ts
   git commit -m "rollback: remove bad column from onboarding_tasks"
   git push origin main
   ```

**Pros**:
- Surgical fix
- Preserves all data
- Fast recovery

**Cons**:
- Requires SQL knowledge
- Manual intervention

---

### Strategy 3: Full Database Restore

**When to use**: Catastrophic data corruption, multiple tables affected

**⚠️ WARNING**: This strategy results in data loss for any transactions after the backup point

**Steps**:
1. Create new Railway database service (don't delete old one yet):
   ```bash
   railway service add --name postgres-rollback
   ```

2. Restore from backup:
   ```bash
   # If you have a pg_dump backup
   psql $NEW_DATABASE_URL < backup_<timestamp>.sql

   # Or use Railway's point-in-time restore (if available)
   railway database restore --timestamp <timestamp>
   ```

3. Point app to new database:
   ```bash
   # Update DATABASE_URL in Railway dashboard
   railway variables set DATABASE_URL=<new_db_url>
   ```

4. Verify data integrity:
   ```bash
   railway run psql $DATABASE_URL

   -- Check critical tables
   SELECT COUNT(*) FROM onboarding_tasks;
   SELECT COUNT(*) FROM transitions_clients;
   SELECT COUNT(*) FROM docusign_webhooks;
   ```

5. Run migrations on restored database:
   ```bash
   railway run npm run migrate
   ```

6. Verify app health:
   ```bash
   curl https://farther-ax.up.railway.app/api/health
   curl https://farther-ax.up.railway.app/api/command-center/pipeline
   ```

**Pros**:
- Complete recovery from catastrophic failure
- Clean slate

**Cons**:
- Data loss (any transactions after backup point)
- Longest downtime
- Most disruptive

---

## Common Rollback Scenarios

### Scenario 1: Migration Script Fails on Deploy

**Symptom**: Railway deploy fails, migration error in logs

**Solution**:
```bash
# 1. Check error logs
railway logs --deployment <deployment_id>

# 2. Fix migration script locally
vim scripts/migrate.ts

# 3. Test locally first
npm run migrate

# 4. Commit and push fix
git add scripts/migrate.ts
git commit -m "fix: correct migration syntax error"
git push origin main
```

---

### Scenario 2: New Column Causes Type Errors

**Symptom**: App crashes with "column does not exist" errors

**Solution** (Code Rollback):
```bash
# 1. Revert code to last working commit
git revert <bad_commit>
git push origin main

# 2. OR remove column from migration script and redeploy
vim scripts/migrate.ts  # Remove ADD COLUMN statement
git commit -am "rollback: remove problematic column"
git push origin main
```

---

### Scenario 3: Data Migration Corrupts Records

**Symptom**: Data looks wrong, calculations off, missing fields

**Solution** (Data-Only Rollback):
```bash
# 1. Connect to database
railway connect postgres

# 2. Identify affected rows
SELECT * FROM onboarding_tasks WHERE updated_at > '2024-04-03 10:00:00';

# 3. Fix data with UPDATE statement
BEGIN;

UPDATE onboarding_tasks
SET completed = FALSE, completed_by = NULL, completed_at = NULL
WHERE id IN (SELECT id FROM onboarding_tasks WHERE updated_at > '2024-04-03 10:00:00');

-- Verify fix
SELECT * FROM onboarding_tasks WHERE updated_at > '2024-04-03 10:00:00';

COMMIT;
```

---

### Scenario 4: Foreign Key Constraint Violation

**Symptom**: Cannot insert/update due to FK violation

**Solution**:
```bash
railway connect postgres

-- Identify orphaned records
SELECT * FROM advisor_assignments a
LEFT JOIN team_members t ON a.member_id = t.id
WHERE t.id IS NULL;

-- Option 1: Delete orphaned records
BEGIN;
DELETE FROM advisor_assignments
WHERE member_id NOT IN (SELECT id FROM team_members);
COMMIT;

-- Option 2: Add missing parent records
BEGIN;
INSERT INTO team_members (name, email, role)
VALUES ('Placeholder', 'placeholder@farther.com', 'AXM')
ON CONFLICT (email) DO NOTHING;

-- Link orphaned records to placeholder
UPDATE advisor_assignments
SET member_id = (SELECT id FROM team_members WHERE email = 'placeholder@farther.com')
WHERE member_id NOT IN (SELECT id FROM team_members);
COMMIT;
```

---

## Post-Rollback Verification

After any rollback, verify these critical paths:

### 1. Health Check
```bash
curl https://farther-ax.up.railway.app/api/health
# Expected: {"ok": true, "status": "healthy", ...}
```

### 2. Pipeline Load
```bash
curl https://farther-ax.up.railway.app/api/command-center/pipeline
# Expected: {"deals": [...], "total": <number>}
```

### 3. Database Connectivity
```bash
railway run psql $DATABASE_URL

-- Check all critical tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check row counts
SELECT
  'onboarding_tasks' AS table, COUNT(*) AS rows FROM onboarding_tasks
UNION ALL
SELECT 'team_members', COUNT(*) FROM team_members
UNION ALL
SELECT 'transitions_clients', COUNT(*) FROM transitions_clients;
```

### 4. Sample API Calls
```bash
# Get advisor detail (replace with real deal ID)
curl https://farther-ax.up.railway.app/api/command-center/advisor/12345

# Get metrics
curl https://farther-ax.up.railway.app/api/command-center/metrics

# Get onboarding checklist (replace with real deal ID)
curl https://farther-ax.up.railway.app/api/command-center/checklist/12345
```

---

## Prevention Best Practices

### 1. Always Test Migrations Locally First
```bash
# Set local DATABASE_URL to test database
export DATABASE_URL="postgresql://localhost:5432/farther_ax_test"

# Run migrations
npm run migrate

# Verify schema
psql $DATABASE_URL -c "\d onboarding_tasks"
```

### 2. Use Transactions for Data Migrations
```sql
BEGIN;

-- Your migration SQL here
UPDATE onboarding_tasks SET ...;

-- Verify before committing
SELECT COUNT(*) FROM onboarding_tasks WHERE ...;

-- Only commit if verification passes
COMMIT;  -- or ROLLBACK if something looks wrong
```

### 3. Create Backups Before Risky Changes
```bash
# Before running risky migration
pg_dump $DATABASE_URL > pre_migration_backup_$(date +%Y%m%d_%H%M%S).sql

# Then run migration
npm run migrate
```

### 4. Monitor Railway Deployment Logs
```bash
# Watch logs during deploy
railway logs --follow

# Stop deploy if errors appear
railway deploy cancel
```

### 5. Stage Changes in Separate PR
```bash
# Create migration-only PR
git checkout -b migration/add-new-column
# Edit scripts/migrate.ts
git commit -m "migration: add new_column to onboarding_tasks"
git push origin migration/add-new-column

# Test in staging environment before merging
```

---

## Emergency Contacts

If rollback fails or requires assistance:

- **Database Admin**: tim@farther.com
- **Railway Support**: https://railway.app/help
- **Emergency Escalation**: Slack #engineering-alerts

---

## Rollback Command Reference

### Quick Commands

```bash
# Connect to production database
railway connect postgres

# View migration history (if using migration tracking)
SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 10;

# Check table structure
\d+ table_name

# Export table before changes
\copy table_name TO 'backup_table.csv' CSV HEADER;

# Import table after rollback
\copy table_name FROM 'backup_table.csv' CSV HEADER;

# View recent changes
SELECT * FROM table_name WHERE updated_at > NOW() - INTERVAL '1 hour';

# Rollback last transaction (if still open)
ROLLBACK;

# Cancel running query
SELECT pg_cancel_backend(pid) FROM pg_stat_activity
WHERE state = 'active' AND query LIKE '%your_query%';
```

---

## Document History

| Date | Author | Change |
|------|--------|--------|
| 2026-04-03 | Claude | Initial rollback procedures documentation |

