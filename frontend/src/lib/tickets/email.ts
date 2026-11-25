import QRCode from 'qrcode';
import { createAdminClient } from '../auth/authorization';

export interface TicketEmailPayload {
  ticketId: string;
  ticketCode: string;
  qrToken: string;
  recipientEmail: string;
  recipientName: string;
  eventTitle: string;
  eventVenue: string | null;
  eventStartsAt: string | null;
  category: string;
}

export async function generateQrDataUrl(qrToken: string): Promise<string> {
  return QRCode.toDataURL(qrToken, {
    width: 320,
    margin: 2,
    color: {
      dark: '#111318',
      light: '#FBF9F5',
    },
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Sends a PVR-style event ticket email with an attached/embedded QR code via Brevo.
 * Never throws on missing config — returns { sent: false, reason } cleanly.
 */
export async function sendTicketEmail(
  payload: TicketEmailPayload
): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || 'EDC AITR';

  if (!apiKey || !senderEmail || apiKey.includes('your-brevo')) {
    return { sent: false, reason: 'Brevo transactional email is not configured yet.' };
  }

  try {
    const pngBuffer = await QRCode.toBuffer(payload.qrToken, {
      type: 'png',
      width: 320,
      margin: 2,
      color: { dark: '#111318', light: '#FFFFFF' },
    });
    const base64Png = pngBuffer.toString('base64');

    const dateLabel = payload.eventStartsAt
      ? new Date(payload.eventStartsAt).toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      : 'Schedule TBA';

    const htmlContent = `
      <div style="background:#FBF9F5;padding:32px 16px;font-family:system-ui,-apple-system,sans-serif;color:#111318;">
        <div style="max-width:440px;margin:0 auto;background:#FFFFFF;border:1px solid #E2DDD4;border-radius:12px;overflow:hidden;">
          <div style="background:#111318;color:#FBF9F5;padding:20px 24px;">
            <div style="font-size:12px;letter-spacing:0.06em;color:#E04826;font-weight:700;">EDC AITR · OFFICIAL PASS</div>
            <h1 style="margin:6px 0 0;font-size:20px;line-height:1.25;">${escapeHtml(payload.eventTitle)}</h1>
          </div>
          <div style="padding:24px;">
            <p style="margin:0 0 12px;font-size:14px;color:#3F4451;">
              Present the attached QR ticket (<strong>ticket-qr.png</strong>) at the Registration &amp; Check-in (RD) desk.
            </p>
            <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0;">
              <tr><td style="padding:6px 0;color:#686D7A;">Attendee</td><td style="padding:6px 0;text-align:right;font-weight:600;">${escapeHtml(payload.recipientName)}</td></tr>
              <tr><td style="padding:6px 0;color:#686D7A;">Ticket ID</td><td style="padding:6px 0;text-align:right;font-family:monospace;font-weight:700;">${escapeHtml(payload.ticketCode)}</td></tr>
              <tr><td style="padding:6px 0;color:#686D7A;">Category</td><td style="padding:6px 0;text-align:right;">${escapeHtml(payload.category)}</td></tr>
              <tr><td style="padding:6px 0;color:#686D7A;">When</td><td style="padding:6px 0;text-align:right;">${escapeHtml(dateLabel)}</td></tr>
              <tr><td style="padding:6px 0;color:#686D7A;">Venue</td><td style="padding:6px 0;text-align:right;">${escapeHtml(payload.eventVenue || 'TBA')}</td></tr>
            </table>
            <div style="margin-top:20px;padding:12px;background:#FBF9F5;border:1px dashed #CBD5E1;border-radius:8px;text-align:center;font-size:12px;color:#686D7A;">
              QR Token: <span style="font-family:monospace;color:#111318;">${escapeHtml(payload.qrToken)}</span>
            </div>
          </div>
        </div>
      </div>
    `;

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: payload.recipientEmail, name: payload.recipientName }],
        subject: `Your Ticket: ${payload.eventTitle} (${payload.ticketCode})`,
        htmlContent,
        attachment: [
          {
            name: 'ticket-qr.png',
            content: base64Png,
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { sent: false, reason: `Brevo API error (${res.status}): ${errText.slice(0, 120)}` };
    }

    const admin = createAdminClient();
    await admin
      .from('tickets')
      .update({ email_sent_at: new Date().toISOString() })
      .eq('id', payload.ticketId);

    return { sent: true };
  } catch (err) {
    return { sent: false, reason: err instanceof Error ? err.message : 'Email dispatch failed.' };
  }
}
