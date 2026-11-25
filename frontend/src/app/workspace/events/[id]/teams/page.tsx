import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '../../../../../lib/supabase/server';
import { getUserRole } from '../../../../../lib/auth/authorization';
import EventTeamsClient from './EventTeamsClient';

export const dynamic = 'force-dynamic';

export default async function EventTeamsPage({
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

  const [{ data: event }, { data: teams }, { data: members }, { data: candidates }, { data: canManage }] =
    await Promise.all([
      supabase.from('events').select('id, title').eq('id', id).maybeSingle(),
      supabase.from('operational_teams').select('code, name, description, display_order').order('display_order'),
      supabase
        .from('event_team_members')
        .select('id, user_id, team_code, is_coordinator, profiles!user_id(full_name, designation)')
        .eq('event_id', id),
      supabase.rpc('get_approved_spoc_candidates'),
      supabase.rpc('can_manage_event', { p_event_id: id, p_user_id: user.id }),
    ]);

  if (!event) notFound();

  const normalizedMembers = (members ?? []).map((m) => {
    const p = Array.isArray(m.profiles) ? (m.profiles[0] ?? null) : (m.profiles ?? null);
    return {
      id: String(m.id),
      user_id: String(m.user_id),
      team_code: String(m.team_code),
      is_coordinator: Boolean(m.is_coordinator),
      full_name: p?.full_name ? String(p.full_name) : 'Unnamed Member',
      designation: p?.designation ? String(p.designation) : null,
    };
  });

  return (
    <>
      <p style={{ marginBottom: 16 }}>
        <Link href={`/workspace/events/${id}`}>← Event overview</Link> ·{' '}
        <Link href={`/workspace/events/${id}/tasks`}>Task board</Link>
      </p>
      <h1>Operational Teams: {event.title}</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        Members grouped across the 12 confirmed operational teams.
      </p>
      <EventTeamsClient
        eventId={id}
        teams={teams ?? []}
        initialMembers={normalizedMembers}
        candidates={(candidates as { id: string; full_name: string; designation: string | null; role: string }[]) ?? []}
        canManage={Boolean(canManage)}
      />
    </>
  );
}
