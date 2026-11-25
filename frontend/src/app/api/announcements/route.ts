import { NextResponse } from 'next/server';
import { createSessionClient, getUserContext, requireRole } from '../../../lib/auth/authorization';

export async function POST(request: Request) {
  const ctx = await getUserContext();
  const authErr = requireRole(ctx, 'core_team');
  if (authErr) {
    return NextResponse.json(
      { error: authErr.message },
      { status: authErr.code === 'unauthenticated' ? 401 : 403 }
    );
  }

  let body: { event_id?: string | null; title?: string; body?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const title = body.title?.trim() ?? '';
  const text = body.body?.trim() ?? '';
  if (!title || !text) {
    return NextResponse.json({ error: 'title and body are required.' }, { status: 400 });
  }

  const supabase = await createSessionClient();
  if (!supabase) return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 });

  const { data, error } = await supabase
    .from('announcements')
    .insert({
      event_id: body.event_id || null,
      title,
      body: text,
      created_by: ctx!.id,
    })
    .select('id, title, body, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 403 });
  return NextResponse.json({ ok: true, announcement: data });
}
