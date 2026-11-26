/**
 * Transactional Email Templates for EDC AITR Candidate Applications
 * Supports Brevo transactional API with fallback graceful logging.
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const ROLE_LABELS: Record<string, string> = {
  core_team_application: 'EDC Core Team Member',
  advisor_application: 'EDC Faculty / Industry Advisor',
  alumni_verification: 'EDC Alumni Connect Membership',
  promotion_nomination: 'Advisor Promotion Nomination',
};

export interface ApplicationReceivedEmailParams {
  recipientEmail: string;
  recipientName: string;
  applicationType: string;
  statement: string;
  applicationId: string;
}

export interface ApplicationDecisionEmailParams {
  recipientEmail: string;
  recipientName: string;
  applicationType: string;
  decision: 'approved' | 'rejected';
  note: string;
  applicationId: string;
}

async function sendBrevoEmail(to: { email: string; name: string }, subject: string, htmlContent: string) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'edc@acropolis.in';
  const senderName = process.env.BREVO_SENDER_NAME || 'EDC AITR';

  if (!apiKey || apiKey.includes('your-brevo')) {
    console.log(`[Email Mock/Dev] Would dispatch email to ${to.email} | Subject: "${subject}"`);
    return { sent: true, mocked: true };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [to],
        subject,
        htmlContent,
      }),
    });
    clearTimeout(timer);
    return { sent: res.ok, status: res.status };
  } catch (err) {
    console.warn('[Email Warning] Failed to send live email via Brevo:', err);
    return { sent: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function sendApplicationReceivedEmail(params: ApplicationReceivedEmailParams) {
  const roleName = ROLE_LABELS[params.applicationType] || 'EDC Role Application';
  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Application Received — EDC AITR</title>
    </head>
    <body style="margin:0;padding:0;background-color:#F4F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#121316;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F4F6;padding:36px 16px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background-color:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E5E5EB;box-shadow:0 8px 30px rgba(0,0,0,0.06);">
              
              <!-- Brand Header -->
              <tr>
                <td style="background-color:#121316;padding:32px 28px;text-align:center;">
                  <div style="font-size:24px;font-weight:800;color:#FFFFFF;letter-spacing:-0.03em;">
                    EDC <span style="color:#C01E30;">AITR</span>
                  </div>
                  <div style="font-size:12px;font-weight:500;color:#A4A4A8;letter-spacing:0.12em;text-transform:uppercase;margin-top:4px;">
                    Entrepreneurship Development Cell · Acropolis Indore
                  </div>
                  <div style="margin-top:16px;">
                    <span style="display:inline-block;padding:4px 14px;border-radius:999px;background-color:rgba(192,30,48,0.2);border:1px solid rgba(192,30,48,0.4);color:#F87171;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
                      Application Under Review
                    </span>
                  </div>
                </td>
              </tr>

              <!-- Main Body -->
              <tr>
                <td style="padding:32px 28px;">
                  <p style="margin:0 0 12px;font-size:17px;font-weight:600;color:#121316;">
                    Hello ${escapeHtml(params.recipientName)},
                  </p>
                  <p style="margin:0 0 20px;font-size:14px;line-height:1.65;color:#4A4B50;">
                    We have successfully received your candidate application for <strong>${escapeHtml(roleName)}</strong>. Your submission is now recorded in our governance queue and forwarded to the leadership board for evaluation.
                  </p>

                  <!-- Details Card -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAFAFC;border:1px solid #EBEBF0;border-radius:10px;margin-bottom:24px;">
                    <tr>
                      <td style="padding:16px 20px;font-size:13px;border-bottom:1px solid #EBEBF0;">
                        <span style="color:#71717A;text-transform:uppercase;font-size:11px;font-weight:600;letter-spacing:0.05em;">Role Applied</span>
                        <div style="font-weight:700;color:#121316;margin-top:3px;">${escapeHtml(roleName)}</div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:16px 20px;font-size:13px;border-bottom:1px solid #EBEBF0;">
                        <span style="color:#71717A;text-transform:uppercase;font-size:11px;font-weight:600;letter-spacing:0.05em;">Submission Date</span>
                        <div style="font-weight:600;color:#121316;margin-top:3px;">${escapeHtml(dateStr)}</div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:16px 20px;font-size:13px;">
                        <span style="color:#71717A;text-transform:uppercase;font-size:11px;font-weight:600;letter-spacing:0.05em;">Application ID</span>
                        <div style="font-family:monospace;font-size:12px;color:#52525B;margin-top:3px;">${escapeHtml(params.applicationId)}</div>
                      </td>
                    </tr>
                  </table>

                  <!-- Statement Quote -->
                  <div style="border-left:3px solid #C01E30;padding:10px 16px;background-color:#FFF5F6;border-radius:0 8px 8px 0;margin-bottom:24px;">
                    <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#C01E30;display:block;margin-bottom:4px;">
                      Your Supporting Statement
                    </span>
                    <p style="margin:0;font-size:13px;line-height:1.6;color:#333;font-style:italic;">
                      "${escapeHtml(params.statement)}"
                    </p>
                  </div>

                  <!-- Next Steps -->
                  <div style="font-size:13px;line-height:1.6;color:#52525B;">
                    <strong>Next Steps:</strong>
                    <ul style="margin:8px 0 0;padding-left:20px;">
                      <li>Applications are reviewed by the EDC Executive Board &amp; Faculty Advisors.</li>
                      <li>You will receive an automated notification immediately once a formal decision is recorded.</li>
                      <li>You can track your live application status anytime in your portal account.</li>
                    </ul>
                  </div>

                  <div style="margin-top:30px;text-align:center;">
                    <a href="https://edc.acropolis.in/account" style="display:inline-block;padding:12px 28px;background-color:#C01E30;color:#FFFFFF;text-decoration:none;border-radius:999px;font-size:13px;font-weight:600;letter-spacing:0.02em;">
                      View Live Application Status →
                    </a>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color:#FAFAFC;border-top:1px solid #EBEBF0;padding:20px 28px;text-align:center;font-size:12px;color:#71717A;">
                  <p style="margin:0 0 4px;font-weight:600;color:#121316;">
                    Entrepreneurship Development Cell (EDC AITR)
                  </p>
                  <p style="margin:0;font-size:11px;">
                    Acropolis Institute of Technology &amp; Research · Manglia Square, Indore, MP 453771<br />
                    Backed by AIIH Foundation · IIC (MoE Innovation Cell) Affiliated
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendBrevoEmail(
    { email: params.recipientEmail, name: params.recipientName },
    `Application Received: ${roleName} — EDC AITR`,
    htmlContent
  );
}

export async function sendApplicationDecisionEmail(params: ApplicationDecisionEmailParams) {
  const roleName = ROLE_LABELS[params.applicationType] || 'EDC Role Application';
  const isApproved = params.decision === 'approved';
  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });

  const subject = isApproved
    ? `🎉 Welcome to EDC AITR! Application Approved for ${roleName}`
    : `Application Status Update: ${roleName} — EDC AITR`;

  const badgeBg = isApproved ? 'rgba(34,197,94,0.15)' : 'rgba(113,113,122,0.15)';
  const badgeBorder = isApproved ? 'rgba(34,197,94,0.4)' : 'rgba(113,113,122,0.4)';
  const badgeColor = isApproved ? '#16A34A' : '#71717A';
  const badgeText = isApproved ? '★ APPLICATION APPROVED ★' : 'STATUS UPDATE';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(subject)}</title>
    </head>
    <body style="margin:0;padding:0;background-color:#F4F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#121316;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F4F6;padding:36px 16px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background-color:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E5E5EB;box-shadow:0 8px 30px rgba(0,0,0,0.06);">
              
              <!-- Brand Header -->
              <tr>
                <td style="background-color:#121316;padding:34px 28px;text-align:center;">
                  <div style="font-size:24px;font-weight:800;color:#FFFFFF;letter-spacing:-0.03em;">
                    EDC <span style="color:#C01E30;">AITR</span>
                  </div>
                  <div style="font-size:12px;font-weight:500;color:#A4A4A8;letter-spacing:0.12em;text-transform:uppercase;margin-top:4px;">
                    Entrepreneurship Development Cell · Acropolis Indore
                  </div>
                  <div style="margin-top:16px;">
                    <span style="display:inline-block;padding:5px 16px;border-radius:999px;background-color:${badgeBg};border:1px solid ${badgeBorder};color:${badgeColor};font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">
                      ${badgeText}
                    </span>
                  </div>
                </td>
              </tr>

              <!-- Main Body -->
              <tr>
                <td style="padding:32px 28px;">
                  <p style="margin:0 0 12px;font-size:18px;font-weight:700;color:#121316;">
                    Dear ${escapeHtml(params.recipientName)},
                  </p>

                  ${
                    isApproved
                      ? `<p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#27272A;">
                          Congratulations! Following the governance and board review, we are thrilled to inform you that your candidate application for <strong>${escapeHtml(roleName)}</strong> has been <span style="color:#16A34A;font-weight:700;">approved</span>.
                        </p>
                        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#52525B;">
                          Your account permissions and official cell directory credentials have been updated. You now have access to internal workspace divisions, event coordination tools, and leadership resources.
                        </p>`
                      : `<p style="margin:0 0 20px;font-size:14px;line-height:1.65;color:#4A4B50;">
                          Thank you for your interest and candidate application for <strong>${escapeHtml(roleName)}</strong>. Following a thorough review by our leadership board, we are unable to advance your application for this specific cycle.
                        </p>
                        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#52525B;">
                          We sincerely value your enthusiasm and encourage you to stay actively engaged in open EDC initiatives, hackathons, and cohort workshops.
                        </p>`
                  }

                  <!-- Governance Note Card -->
                  <div style="border-left:3px solid ${isApproved ? '#16A34A' : '#71717A'};padding:14px 18px;background-color:${isApproved ? '#F0FDF4' : '#F4F4F6'};border-radius:0 10px 10px 0;margin:24px 0;">
                    <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${isApproved ? '#15803D' : '#52525B'};display:block;margin-bottom:6px;">
                      Governance Review Note
                    </span>
                    <p style="margin:0;font-size:13.5px;line-height:1.6;color:#18181B;font-style:italic;">
                      "${escapeHtml(params.note)}"
                    </p>
                    <div style="margin-top:8px;font-size:11px;color:#71717A;">
                      Audited · ${escapeHtml(dateStr)}
                    </div>
                  </div>

                  <!-- Next Actions -->
                  ${
                    isApproved
                      ? `<div style="margin-top:32px;text-align:center;">
                          <a href="https://edc.acropolis.in/account/dashboard" style="display:inline-block;padding:13px 32px;background-color:#16A34A;color:#FFFFFF;text-decoration:none;border-radius:999px;font-size:14px;font-weight:700;letter-spacing:0.02em;box-shadow:0 4px 14px rgba(22,163,74,0.3);">
                            Enter Internal Dashboard →
                          </a>
                        </div>`
                      : `<div style="margin-top:28px;text-align:center;">
                          <a href="https://edc.acropolis.in/events" style="display:inline-block;padding:12px 28px;background-color:#121316;color:#FFFFFF;text-decoration:none;border-radius:999px;font-size:13px;font-weight:600;letter-spacing:0.02em;">
                            Explore Upcoming Events &amp; Cohorts →
                          </a>
                        </div>`
                  }
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color:#FAFAFC;border-top:1px solid #EBEBF0;padding:20px 28px;text-align:center;font-size:12px;color:#71717A;">
                  <p style="margin:0 0 4px;font-weight:600;color:#121316;">
                    Entrepreneurship Development Cell (EDC AITR)
                  </p>
                  <p style="margin:0;font-size:11px;">
                    Acropolis Institute of Technology &amp; Research · Manglia Square, Indore, MP 453771<br />
                    Backed by AIIH Foundation · IIC (MoE Innovation Cell) Affiliated
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendBrevoEmail(
    { email: params.recipientEmail, name: params.recipientName },
    subject,
    htmlContent
  );
}
