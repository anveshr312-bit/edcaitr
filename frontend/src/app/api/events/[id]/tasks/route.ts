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
  let body: {
    team_code?: string;
    title?: string;
    brief?: string;
    deliverable_spec?: string;
    assignee_id?: string | null;
    due_at?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const title = body.title?.trim() ?? '';
  if (!title || !body.team_code) {
    return NextResponse.json({ error: 'title and team_code are required.' }, { status: 400 });
  }

  const supabase = await createSessionClient();
  if (!supabase) return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 });

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      event_id: id,
      team_code: body.team_code,
      title,
      brief: body.brief?.trim() ?? '',
      deliverable_spec: body.deliverable_spec?.trim() || null,
      assignee_id: body.assignee_id || null,
      due_at: body.due_at || null,
      created_by: ctx!.id,
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, task: data });
}
