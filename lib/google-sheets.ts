import { GoogleAuth } from 'google-auth-library';
import crypto from 'crypto';

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
];

function buildPrivateKey(): string {
  let rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ?? '';

  // Strip wrapping quotes if present (some env parsers leave them)
  if (
    (rawKey.startsWith('"') && rawKey.endsWith('"')) ||
    (rawKey.startsWith("'") && rawKey.endsWith("'"))
  ) {
    rawKey = rawKey.slice(1, -1);
  }

  // Extract only base64 characters — strip headers, any kind of whitespace,
  // literal backslash-n sequences, and everything else non-base64
  const base64 = rawKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\\n/g, '')   // literal two-char \n from env
    .replace(/\n/g, '')    // real newlines
    .replace(/\r/g, '')    // carriage returns
    .replace(/\s/g, '')    // any remaining whitespace
    .trim();

  if (!base64) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY is empty or missing');
  }

  // Rebuild PEM with proper 64-char line breaks
  const lines = base64.match(/.{1,64}/g) ?? [];
  const pem =
    '-----BEGIN PRIVATE KEY-----\n' +
    lines.join('\n') +
    '\n-----END PRIVATE KEY-----\n';

  // Validate the key parses with Node's crypto before passing to GoogleAuth
  try {
    crypto.createPrivateKey(pem);
  } catch (err) {
    console.error('[google-sheets] PEM validation failed. Base64 length:', base64.length);
    throw new Error('Private key is invalid: ' + (err instanceof Error ? err.message : String(err)));
  }

  return pem;
}

function getAuthClient(): GoogleAuth {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = buildPrivateKey();

  if (!clientEmail) {
    throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_EMAIL env var');
  }

  return new GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: SCOPES,
  });
}

async function getAccessToken(): Promise<string> {
  const auth = getAuthClient();
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const accessToken = typeof tokenResponse === 'string' ? tokenResponse : tokenResponse?.token;

  if (!accessToken) {
    throw new Error('Failed to obtain access token from service account');
  }

  return accessToken;
}

// ── Drive API ─────────────────────────────────────────────────────────────────

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
}

/**
 * List all Google Sheets in a shared Drive folder (recursive).
 * Searches the folder and all subfolders for spreadsheets.
 * Supports Shared Drives.
 */
export async function listSheetsInFolder(folderId: string): Promise<DriveFile[]> {
  const accessToken = await getAccessToken();
  const sheets: DriveFile[] = [];

  async function searchFolder(parentId: string) {
    // Find spreadsheets directly in this folder
    const sheetQuery = `'${parentId}' in parents and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`;
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

      const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) break;
      const data = await res.json();
      sheets.push(...(data.files ?? []));
      after = data.nextPageToken;
    } while (after);

    // Find subfolders and recurse
    const folderQuery = `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    let folderAfter: string | undefined;
    const subfolders: { id: string }[] = [];
    do {
      const params = new URLSearchParams({
        q: folderQuery,
        fields: 'files(id),nextPageToken',
        pageSize: '100',
        supportsAllDrives: 'true',
        includeItemsFromAllDrives: 'true',
      });
      if (folderAfter) params.set('pageToken', folderAfter);

      const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) break;
      const data = await res.json();
      subfolders.push(...(data.files ?? []));
      folderAfter = data.nextPageToken;
    } while (folderAfter);

    // Recurse into subfolders (only 1 level deep to avoid infinite recursion)
    for (const sub of subfolders) {
      // Only search 1 level of subfolders (advisor folders contain the spreadsheets)
      const subSheetQuery = `'${sub.id}' in parents and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`;
      const subParams = new URLSearchParams({
        q: subSheetQuery,
        fields: 'files(id,name,mimeType,modifiedTime)',
        pageSize: '50',
        supportsAllDrives: 'true',
        includeItemsFromAllDrives: 'true',
      });
      const subRes = await fetch(`https://www.googleapis.com/drive/v3/files?${subParams}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (subRes.ok) {
        const subData = await subRes.json();
        sheets.push(...(subData.files ?? []));
      }
    }
  }

  await searchFolder(folderId);
  return sheets;
}

// ── Sheets API ────────────────────────────────────────────────────────────────

/**
 * Fetch rows from a Google Sheet using the service account.
 * Returns the raw 2D string array (including header row).
 */
export async function fetchSheetData(
  sheetId: string,
  range: string,
): Promise<string[][]> {
  const accessToken = await getAccessToken();

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Sheets API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.values ?? [];
}

/**
 * Get the list of sheet/tab names within a spreadsheet.
 */
export async function getSheetTabs(sheetId: string): Promise<string[]> {
  const accessToken = await getAccessToken();

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties.title`;

  const res = await fetch(url, {
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
