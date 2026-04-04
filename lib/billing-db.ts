/**
 * lib/billing-db.ts
 *
 * Connection to the Billing Portal database (separate from AX DB).
 * Uses raw pg Pool for commission data queries.
 * Requires BILLING_DATABASE_URL environment variable.
 */

import { Pool, type QueryResultRow } from 'pg';

const globalForBillingDb = global as unknown as {
  billingPool: Pool | undefined;
};

function getBillingPool(): Pool {
  if (globalForBillingDb.billingPool) return globalForBillingDb.billingPool;

  const connectionString = process.env.BILLING_DATABASE_URL;
  if (!connectionString) {
    throw new Error('BILLING_DATABASE_URL environment variable is not set');
  }

  globalForBillingDb.billingPool = new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  return globalForBillingDb.billingPool;
}

export async function billingQuery<T extends QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const pool = getBillingPool();
  const result = await pool.query<T>(text, params);
  return result.rows;
}

export async function billingQueryOne<T extends QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await billingQuery<T>(text, params);
  return rows[0] ?? null;
}
