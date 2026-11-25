import { NextResponse } from 'next/server';
import { createSessionClient, getUserContext, requireRole } from '../../../../../lib/auth/authorization';

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

  const { id } = await context.params;
  let body: { user_id?: string; team_code?: string; is_coordinator?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!body.user_id || !body.team_code) {
    return NextResponse.json({ error: 'user_id and team_code are required.' }, { status: 400 });
  }

  const supabase = await createSessionClient();
  if (!supabase) return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 });

  const { data, error } = await supabase
    .from('event_team_members')
    .insert({
      event_id: id,
      user_id: body.user_id,
      team_code: body.team_code,
      is_coordinator: Boolean(body.is_coordinator),
      assigned_by: ctx!.id,
    })
    .select('id, user_id, team_code, is_coordinator')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, member: data });
}

export async function DELETE(
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
  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get('member_id');
  if (!memberId) return NextResponse.json({ error: 'member_id is required.' }, { status: 400 });

  const supabase = await createSessionClient();
  if (!supabase) return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 });

  const { error } = await supabase
    .from('event_team_members')
    .delete()
    .eq('id', memberId)
    .eq('event_id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
