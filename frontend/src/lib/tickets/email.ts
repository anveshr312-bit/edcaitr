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
        <div style="max-width:440px;margin:0 auto;background:#FFFFFF;border:1px solid #E2DDD4;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(17,19,24,0.06);">
          <!-- PVR Ticket Header -->
          <div style="background:#111318;color:#FBF9F5;padding:24px 20px;text-align:center;">
            <div style="font-size:11px;letter-spacing:0.12em;color:#E04826;font-weight:700;text-transform:uppercase;">
              ENTREPRENEURSHIP DEVELOPMENT CELL (EDC)
            </div>
            <div style="font-size:10px;color:#A0A6B2;letter-spacing:0.06em;margin-top:2px;text-transform:uppercase;">
              Acropolis Institute of Technology &amp; Research
            </div>
            <div style="display:inline-block;background:#E04826;color:#FFFFFF;font-size:10px;font-weight:700;letter-spacing:0.14em;padding:4px 12px;border-radius:4px;margin-top:12px;text-transform:uppercase;">
              ★ OFFICIAL ADMISSION PASS ★
            </div>
            <h1 style="margin:12px 0 4px;font-size:20px;line-height:1.25;font-weight:700;color:#FBF9F5;">
              ${escapeHtml(payload.eventTitle)}
            </h1>
            <div style="font-size:11px;color:#A0A6B2;font-family:monospace;">
              REF: PVR-EDC-${escapeHtml(payload.ticketCode.slice(-8))}
            </div>
          </div>

          <!-- Ticket Details Table -->
          <div style="padding:20px 24px;">
            <table style="width:100%;border-collapse:collapse;font-size:13px;line-height:1.4;">
              <tr>
                <td style="padding:6px 0;color:#686D7A;text-transform:uppercase;font-size:11px;font-weight:600;">Audi / Venue</td>
                <td style="padding:6px 0;text-align:right;font-weight:600;color:#111318;">${escapeHtml(payload.eventVenue || 'Campus Auditorium')}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#686D7A;text-transform:uppercase;font-size:11px;font-weight:600;">When</td>
                <td style="padding:6px 0;text-align:right;font-weight:600;color:#111318;">${escapeHtml(dateLabel)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#686D7A;text-transform:uppercase;font-size:11px;font-weight:600;">Attendee</td>
                <td style="padding:6px 0;text-align:right;font-weight:600;color:#111318;">${escapeHtml(payload.recipientName)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#686D7A;text-transform:uppercase;font-size:11px;font-weight:600;">Category</td>
                <td style="padding:6px 0;text-align:right;font-weight:600;color:#E04826;">${escapeHtml(payload.category.toUpperCase())}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#686D7A;text-transform:uppercase;font-size:11px;font-weight:600;">Admit</td>
                <td style="padding:6px 0;text-align:right;font-weight:600;color:#111318;">01 Person</td>
              </tr>
            </table>

            <!-- Perforated Tear Line -->
            <div style="margin:16px 0;border-top:1.5px dashed #CBD5E1;text-align:center;">
              <span style="background:#FFFFFF;position:relative;top:-9px;padding:0 8px;font-size:10px;color:#A0A6B2;letter-spacing:0.08em;text-transform:uppercase;">
                ✂ Entry Stub ✂
              </span>
            </div>

            <!-- QR Verification Pass -->
            <div style="text-align:center;padding:12px;background:#FBF9F5;border:1px solid #E2DDD4;border-radius:8px;">
              <div style="font-size:11px;font-weight:700;color:#111318;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:8px;">
                Scan for Admission
              </div>
              <img src="data:image/png;base64,${base64Png}" alt="Ticket QR Code" width="160" height="160" style="display:block;margin:0 auto;border-radius:4px;" />
              <div style="font-size:12px;font-family:monospace;font-weight:700;color:#111318;margin-top:8px;">
                ${escapeHtml(payload.ticketCode)}
              </div>
              <div style="font-size:10px;color:#686D7A;margin-top:4px;">
                Registration &amp; Check-in (RD) Desk
              </div>
            </div>

            <p style="margin:16px 0 0;font-size:11px;color:#686D7A;text-align:center;line-height:1.4;">
              Present this email or the attached <strong>ticket-qr.png</strong> at the gate.
              <br />
              Valid with college photo ID · Acropolis Institute of Technology &amp; Research
            </p>
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
