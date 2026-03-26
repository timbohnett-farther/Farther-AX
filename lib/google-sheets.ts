import { GoogleAuth } from 'google-auth-library';
import path from 'path';
import fs from 'fs';

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
];

// ── Auth: JSON file locally, JSON string env var on Railway ──────────────────
// Local: GOOGLE_APPLICATION_CREDENTIALS=google-service-account.json
// Railway: GOOGLE_SERVICE_ACCOUNT_JSON = entire JSON file contents as one env var

function getAuthClient(): GoogleAuth {
  // Option 1: JSON credentials file (local dev)
  const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (keyFile) {
    const resolved = path.resolve(keyFile);
    if (fs.existsSync(resolved)) {
      return new GoogleAuth({ keyFile: resolved, scopes: SCOPES });
    }
  }

  // Option 2: Full JSON credentials as a single env var (Railway)
  const jsonCreds = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (jsonCreds) {
    const credentials = JSON.parse(jsonCreds);
    return new GoogleAuth({ credentials, scopes: SCOPES });
  }

  // Option 3: Separate email + key env vars (legacy fallback)
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (clientEmail && rawKey) {
    const privateKey = rawKey.split('\\n').join('\n');
    return new GoogleAuth({
      credentials: { client_email: clientEmail, private_key: privateKey },
      scopes: SCOPES,
    });
  }

  throw new Error(
    'Google auth not configured. Set GOOGLE_APPLICATION_CREDENTIALS (local) ' +
    'or GOOGLE_SERVICE_ACCOUNT_JSON (Railway).',
  );
}

// ── Token cache: tokens last 60 min, we cache for 50 min ────────────────────
let cachedToken: string | null = null;
let tokenExpiresAt = 0;
const TOKEN_TTL_MS = 50 * 60 * 1000; // 50 minutes

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const auth = getAuthClient();
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const accessToken = typeof tokenResponse === 'string' ? tokenResponse : tokenResponse?.token;

  if (!accessToken) {
    throw new Error('Failed to obtain access token from service account');
  }

  cachedToken = accessToken;
  tokenExpiresAt = Date.now() + TOKEN_TTL_MS;
  return accessToken;
}

// ── Retry helper with exponential backoff ────────────────────────────────────
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);

      // Retry on rate limit (429) or server errors (5xx)
      if (res.status === 429 || (res.status >= 500 && attempt < maxRetries)) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.warn(`[google-sheets] ${res.status} on attempt ${attempt + 1}, retrying in ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));

        // On 401, invalidate cached token and refresh
        if (res.status === 401) {
          cachedToken = null;
          tokenExpiresAt = 0;
        }
        continue;
      }

      return res;
    } catch (err) {
      clearTimeout(timeout);
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(`[google-sheets] Fetch error on attempt ${attempt + 1}, retrying in ${delay}ms:`, err);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }

  // Should never reach here, but TypeScript needs it
  throw new Error('Max retries exceeded');
}

// ── Drive API ─────────────────────────────────────────────────────────────────

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
}

/**
 * Lists all Google Sheets in the specified folder (non-recursive).
 *
 * IMPORTANT: Only returns sheets directly in the main folder.
 * Does NOT recurse into subfolders to avoid syncing archived/graduated sheets.
 *
 * Archived sheets moved to "Graduated / Archived Transition Sheets" subfolder
 * will be automatically excluded.
 */
export async function listSheetsInFolder(folderId: string): Promise<DriveFile[]> {
  const accessToken = await getAccessToken();
  const sheets: DriveFile[] = [];

  // Only search the main folder (non-recursive)
  const sheetQuery = `'${folderId}' in parents and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`;
  let after: string | undefined;

  do {
    const params = new URLSearchParams({
      q: sheetQuery,
      fields: 'files(id,name,mimeType,modifiedTime),nextPageToken',
      pageSize: '100',
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true',
    });
    if (after) params.set('pageToken', after);

    const res = await fetchWithRetry(`https://www.googleapis.com/drive/v3/files?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Google Drive API error ${res.status}: ${errText}`);
    }

    const data = await res.json();
    sheets.push(...(data.files ?? []));
    after = data.nextPageToken;
  } while (after);

  return sheets;
}

// ── Sheets API ────────────────────────────────────────────────────────────────

export async function fetchSheetData(
  sheetId: string,
  range: string,
): Promise<string[][]> {
  const accessToken = await getAccessToken();

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`;

  const res = await fetchWithRetry(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Sheets API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.values ?? [];
}

export async function getSheetTabs(sheetId: string): Promise<string[]> {
  const accessToken = await getAccessToken();

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties.title`;

  const res = await fetchWithRetry(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Sheets API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return (data.sheets ?? []).map(
    (s: { properties: { title: string } }) => s.properties.title,
  );
}
