import { NextResponse } from 'next/server';
import { createAdminClient, getUserContext, requireRole } from '../../../../../lib/auth/authorization';

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

  const { id: eventId } = await context.params;
  let body: { action?: string; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!body.action || !['close', 'archive', 'reopen'].includes(body.action)) {
    return NextResponse.json({ error: 'Invalid closure action.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc('transition_event_closure', {
    p_event_id: eventId,
    p_actor_id: ctx!.id,
    p_action: body.action,
    p_reason: body.reason ?? null,
  });

  if (error) {
    const status = error.message.includes('Only Event Leads') ? 403 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json({ ok: true, ...data });
}
