import { NextResponse } from 'next/server';
import { createSessionClient, getUserContext, requireRole } from '../../../../../lib/auth/authorization';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const ctx = await getUserContext();
  const authErr = requireRole(ctx, 'core_team');
  if (authErr) {
    return NextResponse.json({ error: authErr.message }, { status: authErr.code === 'unauthenticated' ? 401 : 403 });
  }

  const { id: eventId } = await context.params;
  let body: { title?: string; caption?: string; media_type?: string; media_ref?: string; is_published?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!body.title?.trim() || !body.media_ref?.trim()) {
    return NextResponse.json({ error: 'title and media_ref are required.' }, { status: 400 });
  }

  const supabase = await createSessionClient();
  if (!supabase) return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 });

  const { data, error } = await supabase
    .from('event_highlights')
    .insert({
      event_id: eventId,
      title: body.title.trim(),
      caption: body.caption?.trim() || null,
      media_type: body.media_type === 'video' ? 'video' : 'image',
      media_ref: body.media_ref.trim(),
      is_published: Boolean(body.is_published),
      created_by: ctx!.id,
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 403 });
  return NextResponse.json({ ok: true, highlight: data });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const ctx = await getUserContext();
  const authErr = requireRole(ctx, 'core_team');
  if (authErr) {
    return NextResponse.json({ error: authErr.message }, { status: authErr.code === 'unauthenticated' ? 401 : 403 });
  }

  const { id: eventId } = await context.params;
  let body: { highlight_id?: string; is_published?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!body.highlight_id) return NextResponse.json({ error: 'highlight_id required.' }, { status: 400 });

  const supabase = await createSessionClient();
  if (!supabase) return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 });

  const { error } = await supabase
    .from('event_highlights')
    .update({ is_published: Boolean(body.is_published) })
    .eq('id', body.highlight_id)
    .eq('event_id', eventId);

  if (error) return NextResponse.json({ error: error.message }, { status: 403 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const ctx = await getUserContext();
  const authErr = requireRole(ctx, 'core_team');
  if (authErr) {
    return NextResponse.json({ error: authErr.message }, { status: authErr.code === 'unauthenticated' ? 401 : 403 });
  }

  const { id: eventId } = await context.params;
  const highlightId = new URL(request.url).searchParams.get('highlight_id');
  if (!highlightId) return NextResponse.json({ error: 'highlight_id required.' }, { status: 400 });

  const supabase = await createSessionClient();
  if (!supabase) return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 });

  const { error } = await supabase
    .from('event_highlights')
    .delete()
    .eq('id', highlightId)
    .eq('event_id', eventId);

  if (error) return NextResponse.json({ error: error.message }, { status: 403 });
  return NextResponse.json({ ok: true });
}
