import { NextResponse } from 'next/server';
import { createAdminClient, getUserContext, requireRole } from '../../../../../../lib/auth/authorization';

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
  let body: { title?: string; only_attended?: boolean };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc('issue_event_certificates', {
    p_event_id: eventId,
    p_issuer_id: ctx!.id,
    p_title: body.title ?? 'Certificate of Participation',
    p_only_attended: body.only_attended ?? true,
  });

  if (error) {
    const status = error.message.includes('Only Event Leads') ? 403 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json({ ok: true, ...data });
}
