import { NextResponse } from 'next/server';
import { createSessionClient, getUserContext, requireRole } from '../../../../lib/auth/authorization';

const VALID_STATUSES = ['todo', 'in_progress', 'submitted', 'approved', 'changes_requested'];

export async function PATCH(
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
  let body: {
    status?: string;
    blocker_note?: string | null;
    submission_url?: string | null;
    assignee_id?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid task status.' }, { status: 400 });
    }
    updates.status = body.status;
  }
  if (body.blocker_note !== undefined) {
    updates.blocker_note = body.blocker_note?.trim() || null;
  }
  if (body.submission_url !== undefined) {
    const url = body.submission_url?.trim() || null;
    if (url && !/^https?:\/\//i.test(url)) {
      return NextResponse.json({ error: 'Submission URL must start with http:// or https://.' }, { status: 400 });
    }
    updates.submission_url = url;
  }
  if (body.assignee_id !== undefined) {
    updates.assignee_id = body.assignee_id || null;
  }

  const supabase = await createSessionClient();
  if (!supabase) return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 });

  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select('*')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: 'Task not found or access denied.' }, { status: 403 });

  return NextResponse.json({ ok: true, task: data });
}
