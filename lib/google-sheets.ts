import { GoogleAuth } from 'google-auth-library';
import path from 'path';

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
];

// ── Auth via JSON credentials file (no PEM env var parsing) ─────────────────
// Set GOOGLE_APPLICATION_CREDENTIALS=google-service-account.json in .env.local

function getAuthClient(): GoogleAuth {
  const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!keyFile) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS env var is not set');
  }

  return new GoogleAuth({
    keyFile: path.resolve(keyFile),
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

export async function listSheetsInFolder(folderId: string): Promise<DriveFile[]> {
  const accessToken = await getAccessToken();
  const sheets: DriveFile[] = [];

  async function searchFolder(parentId: string) {
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

    for (const sub of subfolders) {
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
