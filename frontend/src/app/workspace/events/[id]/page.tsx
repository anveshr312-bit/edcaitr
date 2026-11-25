import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '../../../../lib/supabase/server';
import { getUserRole } from '../../../../lib/auth/authorization';
import ManageEventClient from './ManageEventClient';

export const dynamic = 'force-dynamic';

export default async function ManageEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  if (!supabase) redirect('/account');

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect('/account');

  const role = await getUserRole(user.id);
  if (!['core_team', 'advisor', 'director'].includes(role)) {
    redirect('/account/dashboard');
  }

  const [{ data: event }, { data: spocs }, { data: guests }, { data: candidates }] = await Promise.all([
    supabase.from('events').select('*').eq('id', id).maybeSingle(),
    supabase
      .from('event_spocs')
      .select('user_id, is_primary, profiles!user_id(full_name, designation)')
      .eq('event_id', id),
    supabase.from('event_guests').select('*').eq('event_id', id).order('display_order'),
    supabase.rpc('get_approved_spoc_candidates'),
  ]);

  if (!event) notFound();

  const normalizedSpocs = (spocs ?? []).map((s) => {
    const p = Array.isArray(s.profiles) ? (s.profiles[0] ?? null) : (s.profiles ?? null);
    return {
      user_id: String(s.user_id),
      is_primary: Boolean(s.is_primary),
      full_name: p?.full_name ? String(p.full_name) : 'Unnamed',
      designation: p?.designation ? String(p.designation) : null,
    };
  });

  return (
    <>
      <p style={{ marginBottom: 16 }}>
        <Link href="/workspace/events">← All managed events</Link> ·{' '}
        <Link href={`/workspace/events/${id}/teams`}>Operational Teams</Link> ·{' '}
        <Link href={`/workspace/events/${id}/tasks`}>Task Board</Link>
        {event.status !== 'draft' && (
          <>
            {' · '}
            <Link href={`/events/${event.slug}`}>View public page →</Link>
          </>
        )}
      </p>
      <h1>Manage: {event.title}</h1>
      <ManageEventClient
        event={event}
        initialSpocs={normalizedSpocs}
        initialGuests={guests ?? []}
        candidates={(candidates as { id: string; full_name: string; designation: string | null; role: string }[]) ?? []}
      />
    </>
  );
}
