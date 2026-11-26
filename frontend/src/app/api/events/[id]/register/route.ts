import { after, NextResponse } from 'next/server';
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
    track_id?: string;
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

  // Build RPC arguments. Only include p_track_id if a track was selected,
  // ensuring backwards compatibility with databases that have the 6-parameter
  // register_for_event function and preventing PostgREST schema cache misses (PGRST202).
  const rpcArgs: Record<string, unknown> = {
    p_event_id: eventId,
    p_user_id: ctx!.id,
    p_category: body.participant_category ?? 'student',
    p_organization: body.organization ?? null,
    p_payment_ref: body.payment_ref ?? null,
    p_payment_proof_ref: body.payment_proof_ref ?? null,
  };

  if (body.track_id) {
    rpcArgs.p_track_id = body.track_id;
  }

  let { data, error } = await admin.rpc('register_for_event', rpcArgs);

  // If p_track_id was sent but the database only has the 6-parameter function signature (PGRST202),
  // retry without p_track_id so the participant is still registered successfully.
  if (error && (error.code === 'PGRST202' || error.message?.includes('schema cache')) && body.track_id) {
    delete rpcArgs.p_track_id;
    const retry = await admin.rpc('register_for_event', rpcArgs);
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    const status = error.message.includes('full') || error.message.includes('already') ? 409 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }

  if (data?.status === 'confirmed' && data?.ticket_id && ctx!.email) {
    const ticketId = data.ticket_id as string;
    const ticketCode = data.ticket_code as string;
    const qrToken = data.qr_token as string;
    const recipientEmail = ctx!.email;
    const userId = ctx!.id;
    const category = body.participant_category ?? 'student';

    // Dispatch ticket email after sending HTTP response so registration feels instant
    after(async () => {
      try {
        const [{ data: ev }, { data: prof }] = await Promise.all([
          admin.from('events').select('title, venue, starts_at').eq('id', eventId).single(),
          admin.from('profiles').select('full_name').eq('id', userId).single(),
        ]);

        await sendTicketEmail({
          ticketId,
          ticketCode,
          qrToken,
          recipientEmail,
          recipientName: prof?.full_name || recipientEmail,
          eventTitle: ev?.title ?? 'EDC AITR Event',
          eventVenue: ev?.venue ?? null,
          eventStartsAt: ev?.starts_at ?? null,
          category,
        });
      } catch (err) {
        console.error('[register] background ticket email failed:', err);
      }
    });
  }

  return NextResponse.json({
    ok: true,
    ...data,
    email_sent: data?.status === 'confirmed' ? 'queued' : false,
  });
}
