import { NextResponse } from 'next/server';
import { createAdminClient, getUserContext, requireRole } from '../../../../../lib/auth/authorization';
import { sendTicketEmail } from '../../../../../lib/tickets/email';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const ctx = await getUserContext();
  const authErr = requireRole(ctx, 'core_team');
  if (authErr) {
    return NextResponse.json(
      { error: authErr.message },
      { status: authErr.code === 'unauthenticated' ? 401 : 403 }
    );
  }

  const { id: registrationId } = await context.params;
  let body: { decision?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (body.decision !== 'verified' && body.decision !== 'rejected') {
    return NextResponse.json({ error: 'decision must be verified or rejected.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc('verify_registration_payment', {
    p_registration_id: registrationId,
    p_verifier_id: ctx!.id,
    p_decision: body.decision,
  });

  if (error) {
    const status = error.message.includes('Only Event Leads') ? 403 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }

  let emailSent = false;
  if (data?.decision === 'verified' && data?.ticket_id && data?.user_id) {
    const [{ data: userAuth }, { data: ev }, { data: prof }, { data: reg }] = await Promise.all([
      admin.auth.admin.getUserById(data.user_id),
      admin.from('events').select('title, venue, starts_at').eq('id', data.event_id).single(),
      admin.from('profiles').select('full_name').eq('id', data.user_id).single(),
      admin.from('registrations').select('participant_category').eq('id', registrationId).single(),
    ]);

    const email = userAuth?.user?.email;
    if (email) {
      const res = await sendTicketEmail({
        ticketId: data.ticket_id,
        ticketCode: data.ticket_code,
        qrToken: data.qr_token,
        recipientEmail: email,
        recipientName: prof?.full_name || email,
        eventTitle: ev?.title ?? 'E-Cell AITR Event',
        eventVenue: ev?.venue ?? null,
        eventStartsAt: ev?.starts_at ?? null,
        category: reg?.participant_category ?? 'student',
      });
      emailSent = res.sent;
    }
  }

  return NextResponse.json({ ok: true, ...data, email_sent: emailSent });
}
