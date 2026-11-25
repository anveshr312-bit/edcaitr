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
  let body: { title?: string; description?: string; file_ref?: string; file_size_kb?: number | null; is_public?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!body.title?.trim() || !body.file_ref?.trim()) {
    return NextResponse.json({ error: 'title and file_ref are required.' }, { status: 400 });
  }

  const supabase = await createSessionClient();
  if (!supabase) return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 });

  const { data, error } = await supabase
    .from('event_manuals')
    .insert({
      event_id: eventId,
      title: body.title.trim(),
      description: body.description?.trim() || null,
      file_ref: body.file_ref.trim(),
      file_size_kb: body.file_size_kb ? Number(body.file_size_kb) : null,
      is_public: body.is_public ?? true,
      created_by: ctx!.id,
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 403 });
  return NextResponse.json({ ok: true, manual: data });
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
  const manualId = new URL(request.url).searchParams.get('manual_id');
  if (!manualId) return NextResponse.json({ error: 'manual_id required.' }, { status: 400 });

  const supabase = await createSessionClient();
  if (!supabase) return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 });

  const { error } = await supabase
    .from('event_manuals')
    .delete()
    .eq('id', manualId)
    .eq('event_id', eventId);

  if (error) return NextResponse.json({ error: error.message }, { status: 403 });
  return NextResponse.json({ ok: true });
}
