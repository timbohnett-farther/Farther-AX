/**
 * HubSpot API Client — Centralized integration with retry logic + rate limiting
 *
 * Features:
 * - Automatic retry on 429/502/503 with exponential backoff
 * - Request timeouts (30s default, prevents hanging)
 * - Pagination helpers for search API
 * - Batch upsert operations (max 100 per batch)
 * - Type-safe response interfaces
 * - Consistent error handling
 *
 * Usage:
 * ```ts
 * import { hubspotFetch, paginatedSearch, batchUpsert } from '@/lib/hubspot';
 *
 * // Simple fetch with retry
 * const deal = await hubspotFetch('/crm/v3/objects/deals/12345?properties=dealname');
 *
 * // Paginated search
 * const deals = await paginatedSearch('deals', filterGroups, ['dealname', 'aum']);
 *
 * // Batch upsert
 * await batchUpsert('contacts', inputs);
 * ```
 */

import { fetchWithTimeout, API_TIMEOUTS } from './api-timeout';

const HUBSPOT_PAT = process.env.HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_PAT || '';
const BASE_URL = 'https://api.hubapi.com';
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;
const BATCH_SIZE = 100;

// ── Type Definitions ──────────────────────────────────────────────────────────

export interface HubSpotError {
  status: number;
  message: string;
  category?: string;
  correlationId?: string;
}

export interface HubSpotPaginationResult<T> {
  results: T[];
  paging?: {
    next?: {
      after: string;
    };
  };
}

export interface HubSpotSearchResult {
  id: string;
  properties: Record<string, string | null>;
  createdAt?: string;
  updatedAt?: string;
  archived?: boolean;
}

export interface HubSpotAssociation {
  toObjectId: string;
  associationTypes?: Array<{
    category: string;
    typeId: number;
  }>;
}

export interface HubSpotBatchInput {
  idProperty?: string;
  id?: string;
  properties: Record<string, string | number | boolean | null>;
}

export interface HubSpotBatchResult {
  success: number;
  failed: number;
  total: number;
  errors?: Array<{
    status: string;
    message: string;
    correlationId?: string;
  }>;
}

// ── Core Fetch Wrapper with Retry Logic ──────────────────────────────────────

/**
 * Smart fetch wrapper with automatic retry on transient failures
 *
 * Retries on:
 * - 429 (Rate Limited) — exponential backoff
 * - 502 (Bad Gateway) — HubSpot server issue
 * - 503 (Service Unavailable) — HubSpot maintenance/overload
 *
 * Does NOT retry on:
 * - 400 (Bad Request) — client error, won't succeed on retry
 * - 401/403 (Auth errors) — token issue, won't succeed on retry
 * - 404 (Not Found) — object doesn't exist
 */
export async function hubspotFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetchWithTimeout(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${HUBSPOT_PAT}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      }, API_TIMEOUTS.SYNC);

      // Success — return parsed JSON
      if (res.ok) {
        return await res.json() as T;
      }

      // Rate limited or server error — retry with backoff
      if (res.status === 429 || res.status === 502 || res.status === 503) {
        const isLastAttempt = attempt === MAX_RETRIES - 1;

        if (isLastAttempt) {
          const errorBody = await res.text();
          throw new Error(
            `HubSpot ${res.status} after ${MAX_RETRIES} attempts: ${errorBody}`
          );
        }

        // Exponential backoff: 1s → 2s → 4s
        const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
        console.warn(
          `HubSpot ${res.status} on attempt ${attempt + 1}/${MAX_RETRIES}. ` +
          `Retrying in ${backoffMs}ms...`
        );
        await sleep(backoffMs);
        continue;
      }

      // Client error (400, 401, 403, 404) — don't retry, throw immediately
      const errorBody = await res.text();
      throw new Error(`HubSpot ${res.status}: ${errorBody}`);

    } catch (error) {
      // Network error or parse error
      if (error instanceof Error && error.message.startsWith('HubSpot')) {
        throw error; // Re-throw HubSpot errors
      }

      const isLastAttempt = attempt === MAX_RETRIES - 1;
      if (isLastAttempt) {
        throw new Error(`HubSpot request failed after ${MAX_RETRIES} attempts: ${error}`);
      }

      // Retry on network errors
      const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
      console.warn(`Network error on attempt ${attempt + 1}/${MAX_RETRIES}. Retrying in ${backoffMs}ms...`);
      await sleep(backoffMs);
    }
  }

  throw new Error('Unreachable: exceeded max retries');
}

// ── Pagination Helper ─────────────────────────────────────────────────────────

/**
 * Paginated search for HubSpot CRM objects
 *
 * Automatically handles pagination using 'after' cursor.
 * Returns ALL results across all pages.
 *
 * @param objectType - 'deals', 'contacts', 'companies', or custom object ID
 * @param filterGroups - HubSpot filter groups (max 5)
 * @param properties - Array of property names to return
 * @param sorts - Optional sort configuration
 * @param limit - Results per page (default 100, max 100)
 */
export async function paginatedSearch<T = HubSpotSearchResult>(
  objectType: string,
  filterGroups: Array<{
    filters: Array<{
      propertyName: string;
      operator: string;
      value?: string | number;
      values?: Array<string | number>;
    }>;
  }>,
  properties: string[],
  sorts?: Array<{ propertyName: string; direction: 'ASCENDING' | 'DESCENDING' }>,
  limit: number = 100
): Promise<T[]> {
  const results: T[] = [];
  let after: string | undefined;

  do {
    const body: any = {
      filterGroups,
      properties,
      limit,
    };

    if (sorts) body.sorts = sorts;
    if (after) body.after = after;

    const data = await hubspotFetch<HubSpotPaginationResult<T>>(
      `/crm/v3/objects/${objectType}/search`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );

    results.push(...data.results);
    after = data.paging?.next?.after;
  } while (after);

  return results;
}

// ── Batch Upsert Helper ───────────────────────────────────────────────────────

/**
 * Batch upsert objects to HubSpot CRM
 *
 * Automatically chunks large datasets into batches of 100 (HubSpot limit).
 * Uses exponential backoff retry on failures.
 * Returns summary statistics.
 *
 * @param objectType - 'contacts', 'deals', 'companies', or custom object ID (e.g. '2-43030000')
 * @param inputs - Array of objects with idProperty + properties
 * @param batchSize - Items per batch (default 100, max 100)
 *
 * @example
 * ```ts
 * const inputs = [
 *   {
 *     idProperty: 'email',
 *     properties: { email: 'john@example.com', firstname: 'John' }
 *   }
 * ];
 * const result = await batchUpsert('contacts', inputs);
 * console.log(`Upserted ${result.success} / ${result.total} contacts`);
 * ```
 */
export async function batchUpsert(
  objectType: string,
  inputs: HubSpotBatchInput[],
  batchSize: number = BATCH_SIZE
): Promise<HubSpotBatchResult> {
  const stats: HubSpotBatchResult = {
    success: 0,
    failed: 0,
    total: inputs.length,
    errors: [],
  };

  // Chunk inputs into batches
  for (let i = 0; i < inputs.length; i += batchSize) {
    const batch = inputs.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(inputs.length / batchSize);

    try {
      const result = await hubspotFetch(
        `/crm/v3/objects/${objectType}/batch/upsert`,
        {
          method: 'POST',
          body: JSON.stringify({ inputs: batch }),
        }
      );

      stats.success += batch.length;
      console.log(
        `✓ Batch ${batchNum}/${totalBatches}: Upserted ${batch.length} ${objectType}`
      );
    } catch (error) {
      stats.failed += batch.length;
      const errorMsg = error instanceof Error ? error.message : String(error);
      stats.errors?.push({
        status: 'error',
        message: `Batch ${batchNum} failed: ${errorMsg}`,
      });
      console.error(
        `✗ Batch ${batchNum}/${totalBatches} failed:`,
        errorMsg
      );
    }
  }

  return stats;
}

// ── Fetch Object with Associations ────────────────────────────────────────────

/**
 * Fetch a CRM object with its associations in a single call
 *
 * Common pattern: fetch deal + associated contacts + notes
 *
 * @param objectType - 'deals', 'contacts', 'companies', etc.
 * @param objectId - HubSpot object ID
 * @param properties - Comma-separated property names
 * @param associations - Comma-separated association types (e.g., 'contacts,notes')
 */
export async function fetchWithAssociations<T = any>(
  objectType: string,
  objectId: string,
  properties: string,
  associations?: string
): Promise<T> {
  const params = new URLSearchParams({ properties });
  if (associations) params.set('associations', associations);

  return hubspotFetch<T>(
    `/crm/v3/objects/${objectType}/${objectId}?${params.toString()}`
  );
}

// ── Fetch Associations for Object ─────────────────────────────────────────────

/**
 * Fetch associations for a CRM object
 *
 * @param fromObjectType - Source object type ('deals', 'contacts', etc.)
 * @param fromObjectId - Source object ID
 * @param toObjectType - Target object type ('contacts', 'notes', etc.)
 */
export async function fetchAssociations(
  fromObjectType: string,
  fromObjectId: string,
  toObjectType: string
): Promise<HubSpotAssociation[]> {
  const data = await hubspotFetch<{ results: HubSpotAssociation[] }>(
    `/crm/v4/objects/${fromObjectType}/${fromObjectId}/associations/${toObjectType}`
  );
  return data.results ?? [];
}

// ── Batch Read Objects ─────────────────────────────────────────────────────────

/**
 * Batch read multiple objects by ID
 *
 * More efficient than multiple individual fetches.
 * Max 100 IDs per call.
 *
 * @param objectType - 'contacts', 'deals', 'companies', etc.
 * @param ids - Array of object IDs
 * @param properties - Array of property names to return
 */
export async function batchRead<T = HubSpotSearchResult>(
  objectType: string,
  ids: string[],
  properties: string[]
): Promise<T[]> {
  if (ids.length === 0) return [];

  const results: T[] = [];

  // Chunk into batches of 100
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);

    const data = await hubspotFetch<{ results: T[] }>(
      `/crm/v3/objects/${objectType}/batch/read`,
      {
        method: 'POST',
        body: JSON.stringify({
          inputs: batch.map(id => ({ id })),
          properties,
        }),
      }
    );

    results.push(...data.results);
  }

  return results;
}

// ── Utility Functions ──────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format HubSpot error for logging
 */
export function formatHubSpotError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Check if HubSpot API token is configured
 */
export function isHubSpotConfigured(): boolean {
  return Boolean(HUBSPOT_PAT && HUBSPOT_PAT.length > 0);
}
