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
    full_name?: string;
    title?: string;
    bio?: string;
    linkedin_url?: string;
    photo_ref?: string;
    private_contact?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const fullName = body.full_name?.trim() ?? '';
  if (!fullName) return NextResponse.json({ error: 'Guest full_name is required.' }, { status: 400 });

  const supabase = await createSessionClient();
  if (!supabase) return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 });

  const { data, error } = await supabase
    .from('event_guests')
    .insert({
      event_id: id,
      full_name: fullName,
      title: body.title?.trim() || null,
      bio: body.bio?.trim() || null,
      linkedin_url: body.linkedin_url?.trim() || null,
      photo_ref: body.photo_ref?.trim() || null,
      private_contact: body.private_contact?.trim() || null,
    })
    .select('id, full_name, title, bio, linkedin_url, photo_ref, private_contact')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, guest: data });
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
  const guestId = searchParams.get('guest_id');
  if (!guestId) return NextResponse.json({ error: 'guest_id is required.' }, { status: 400 });

  const supabase = await createSessionClient();
  if (!supabase) return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 });

  const { error } = await supabase
    .from('event_guests')
    .delete()
    .eq('id', guestId)
    .eq('event_id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
