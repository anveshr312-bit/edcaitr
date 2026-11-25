import { NextResponse } from 'next/server';
import { createSessionClient, getUserContext, requireRole } from '../../../../lib/auth/authorization';

export async function POST(request: Request) {
  const ctx = await getUserContext();
  const authErr = requireRole(ctx, 'alumni');
  if (authErr) {
    return NextResponse.json(
      { error: authErr.message },
      { status: authErr.code === 'unauthenticated' ? 401 : 403 }
    );
  }

  let body: {
    name?: string;
    description?: string;
    stage?: string;
    team_summary?: string;
    website_url?: string;
    pitch_deck_url?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!body.name?.trim() || !body.description?.trim()) {
    return NextResponse.json({ error: 'Startup name and description are required.' }, { status: 400 });
  }

  const supabase = await createSessionClient();
  if (!supabase) return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 });

  const { data, error } = await supabase
    .from('startups')
    .insert({
      owner_id: ctx!.id,
      name: body.name.trim(),
      description: body.description.trim(),
      stage: body.stage?.trim() || 'idea',
      team_summary: body.team_summary?.trim() || null,
      website_url: body.website_url?.trim() || null,
      pitch_deck_url: body.pitch_deck_url?.trim() || null,
      status: 'submitted',
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, startup: data });
}

export async function PATCH(request: Request) {
  const ctx = await getUserContext();
  const authErr = requireRole(ctx, 'alumni');
  if (authErr) {
    return NextResponse.json(
      { error: authErr.message },
      { status: authErr.code === 'unauthenticated' ? 401 : 403 }
    );
  }

  let body: { id?: string; status?: string; moderator_note?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!body.id || !body.status) {
    return NextResponse.json({ error: 'id and status are required.' }, { status: 400 });
  }

  if (body.status === 'published') {
    const modErr = requireRole(ctx, 'advisor');
    if (modErr) return NextResponse.json({ error: 'Only Advisors or Director can publish startups.' }, { status: 403 });
  }

  const supabase = await createSessionClient();
  if (!supabase) return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 });

  const { error } = await supabase
    .from('startups')
    .update({ status: body.status, moderator_note: body.moderator_note?.trim() || null })
    .eq('id', body.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 403 });
  return NextResponse.json({ ok: true });
}
