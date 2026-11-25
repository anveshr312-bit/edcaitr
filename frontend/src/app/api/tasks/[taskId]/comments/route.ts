import { NextResponse } from 'next/server';
import { createSessionClient, getUserContext, requireRole } from '../../../../../lib/auth/authorization';

export async function POST(
  request: Request,
  context: { params: Promise<{ taskId: string }> }
) {
  const ctx = await getUserContext();
  const authErr = requireRole(ctx, 'core_team');
  if (authErr) {
    return NextResponse.json(
      { error: authErr.message },
      { status: authErr.code === 'unauthenticated' ? 401 : 403 }
    );
  }

  const { taskId } = await context.params;
  let body: { body?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const text = body.body?.trim() ?? '';
  if (!text) return NextResponse.json({ error: 'Comment body is required.' }, { status: 400 });

  const supabase = await createSessionClient();
  if (!supabase) return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 });

  const { data, error } = await supabase
    .from('task_comments')
    .insert({
      task_id: taskId,
      author_id: ctx!.id,
      body: text,
    })
    .select('id, task_id, author_id, body, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, comment: data });
}
