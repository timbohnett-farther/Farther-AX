/**
 * Fetch with timeout wrapper to prevent hanging requests.
 * 
 * External APIs (HubSpot, DocuSign, Google, OpenAI) can hang indefinitely
 * if they experience issues. This wrapper ensures all requests timeout
 * after a configurable duration (default 30s).
 */

export class TimeoutError extends Error {
  constructor(url: string, timeout: number) {
    super(`Request to ${url} timed out after ${timeout}ms`);
    this.name = 'TimeoutError';
  }
}

/**
 * Fetch with automatic timeout using AbortController.
 * 
 * @param url - The URL to fetch
 * @param options - Standard fetch options
 * @param timeoutMs - Timeout in milliseconds (default: 30000 = 30s)
 * @returns Promise<Response>
 * @throws TimeoutError if request exceeds timeout
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TimeoutError(url, timeoutMs);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Timeout constants for different API types.
 * 
 * - Sync operations: 30s (HubSpot search, DocuSign envelope creation)
 * - Batch operations: 60s (HubSpot batch reads, Google Sheets sync)
 * - File operations: 90s (S3 uploads, large file processing)
 */
export const API_TIMEOUTS = {
  SYNC: 30000,   // 30 seconds
  BATCH: 60000,  // 60 seconds
  FILE: 90000,   // 90 seconds
} as const;
