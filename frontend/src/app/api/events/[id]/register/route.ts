import { NextResponse } from 'next/server';
import { createAdminClient, getUserContext, requireRole } from '../../../../../lib/auth/authorization';
import { sendTicketEmail } from '../../../../../lib/tickets/email';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const ctx = await getUserContext();
  const authErr = requireRole(ctx, 'participant');
  if (authErr) {
    return NextResponse.json({ error: authErr.message }, { status: 401 });
  }

  const { id: eventId } = await context.params;
  let body: {
    participant_category?: string;
    organization?: string;
    payment_ref?: string;
    payment_proof_ref?: string;
  };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc('register_for_event', {
    p_event_id: eventId,
    p_user_id: ctx!.id,
    p_category: body.participant_category ?? 'student',
    p_organization: body.organization ?? null,
    p_payment_ref: body.payment_ref ?? null,
    p_payment_proof_ref: body.payment_proof_ref ?? null,
  });

  if (error) {
    const status = error.message.includes('full') || error.message.includes('already') ? 409 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }

  let emailResult: { sent: boolean; reason?: string } = { sent: false };
  if (data?.status === 'confirmed' && data?.ticket_id && ctx!.email) {
    const [{ data: ev }, { data: prof }] = await Promise.all([
      admin.from('events').select('title, venue, starts_at').eq('id', eventId).single(),
      admin.from('profiles').select('full_name').eq('id', ctx!.id).single(),
    ]);

    emailResult = await sendTicketEmail({
      ticketId: data.ticket_id,
      ticketCode: data.ticket_code,
      qrToken: data.qr_token,
      recipientEmail: ctx!.email,
      recipientName: prof?.full_name || ctx!.email,
      eventTitle: ev?.title ?? 'E-Cell AITR Event',
      eventVenue: ev?.venue ?? null,
      eventStartsAt: ev?.starts_at ?? null,
      category: body.participant_category ?? 'student',
    });
  }

  return NextResponse.json({
    ok: true,
    ...data,
    email_sent: emailResult.sent,
    email_note: emailResult.reason ?? null,
  });
}
