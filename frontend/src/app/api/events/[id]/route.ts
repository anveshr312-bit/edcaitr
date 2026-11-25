import { NextResponse } from 'next/server';
import { createSessionClient, getUserContext, requireRole } from '../../../../lib/auth/authorization';

export async function PATCH(
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

  const { id } = await context.params;
  const supabase = await createSessionClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const allowedUpdates: Record<string, unknown> = {};
  const fields = [
    'title', 'summary', 'description', 'venue', 'starts_at', 'ends_at',
    'status', 'is_paid', 'fee_amount', 'upi_id', 'upi_qr_ref', 'poster_ref', 'max_capacity',
    'google_sheet_id',
  ];
  for (const f of fields) {
    if (f in body) allowedUpdates[f] = body[f];
  }

  const { data, error } = await supabase
    .from('events')
    .update(allowedUpdates)
    .eq('id', id)
    .select('id, status')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Event not found or you do not have permission to manage it.' }, { status: 403 });
  }

  return NextResponse.json({ ok: true, event: data });
}
