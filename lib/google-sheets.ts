import { GoogleAuth } from 'google-auth-library';

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
];

let authClient: GoogleAuth | null = null;

function getAuthClient(): GoogleAuth {
  if (authClient) return authClient;

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error(
      'Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY env vars',
    );
  }

  authClient = new GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: SCOPES,
  });

  return authClient;
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
 * List all Google Sheets in a shared Drive folder.
 * The folder must be shared with the service account email.
 */
export async function listSheetsInFolder(folderId: string): Promise<DriveFile[]> {
  const accessToken = await getAccessToken();

  const query = `'${folderId}' in parents and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`;
  const params = new URLSearchParams({
    q: query,
    fields: 'files(id,name,mimeType,modifiedTime)',
    orderBy: 'name',
    pageSize: '100',
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: 'true',
  });

  const url = `https://www.googleapis.com/drive/v3/files?${params.toString()}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Drive API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.files ?? [];
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
