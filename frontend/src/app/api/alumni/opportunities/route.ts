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
    startup_name?: string;
    listing_type?: string;
    title?: string;
    description?: string;
    skills?: string;
    location?: string;
    compensation?: string;
    application_method?: string;
    deadline?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!body.title?.trim() || !body.description?.trim() || !body.application_method?.trim()) {
    return NextResponse.json({ error: 'title, description, and application_method are required.' }, { status: 400 });
  }

  const supabase = await createSessionClient();
  if (!supabase) return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 });

  const { data, error } = await supabase
    .from('opportunities')
    .insert({
      author_id: ctx!.id,
      startup_name: body.startup_name?.trim() || null,
      listing_type: ['internship', 'full_time', 'cofounder'].includes(body.listing_type ?? '')
        ? body.listing_type
        : 'internship',
      title: body.title.trim(),
      description: body.description.trim(),
      skills: body.skills?.trim() || null,
      location: body.location?.trim() || null,
      compensation: body.compensation?.trim() || null,
      application_method: body.application_method.trim(),
      deadline: body.deadline || null,
      status: 'open',
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, opportunity: data });
}
