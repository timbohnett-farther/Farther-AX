/**
 * Database client compatibility layer
 *
 * This project uses PostgreSQL via `pg` pool (lib/db.ts), not Prisma ORM.
 * This file provides a compatibility export for legacy code that imports prisma.
 *
 * For new code, import `pool` from '@/lib/db' directly.
 */

import pool from './db';

// Export pool as default for compatibility with prisma imports
export default pool;

// Also export as named export
export { pool };
