import crypto from 'node:crypto';
import { createAdminClient } from '../auth/authorization';

function base64Url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function getGoogleAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64Url(
    JSON.stringify({
      iss: clientEmail,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    })
  );
  const unsigned = `${header}.${claim}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsigned);
  const signature = base64Url(signer.sign(privateKey.replace(/\\n/g, '\n')));

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${signature}`,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || 'Google token exchange failed.');
  }
  return data.access_token as string;
}

export async function syncAttendanceToGoogleSheet(params: {
  attendanceId: string;
  sheetId: string | null | undefined;
  ticketCode: string;
  participantName: string;
  category: string;
  organization: string;
  checkedInAt: string;
}): Promise<{ synced: boolean; reason?: string }> {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;

  if (!params.sheetId) {
    return { synced: false, reason: 'No Google Sheet ID configured on this event.' };
  }
  if (!clientEmail || !privateKey) {
    return { synced: false, reason: 'Google Sheets service account is not configured.' };
  }

  try {
    const token = await getGoogleAccessToken(clientEmail, privateKey);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      params.sheetId
    )}/values/A1:append?valueInputOption=USER_ENTERED`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [
          [
            params.ticketCode,
            params.participantName,
            params.category,
            params.organization,
            params.checkedInAt,
          ],
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { synced: false, reason: `Sheets API ${res.status}: ${errText.slice(0, 120)}` };
    }

    const admin = createAdminClient();
    await admin
      .from('attendance_logs')
      .update({ sheets_synced_at: new Date().toISOString() })
      .eq('id', params.attendanceId);

    return { synced: true };
  } catch (err) {
    return { synced: false, reason: err instanceof Error ? err.message : 'Sheets sync error.' };
  }
}
