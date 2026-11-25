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
      {/* Header */}
      <div style={{ background: 'var(--color-2-mood)', color: 'var(--color-1-mood)', padding: '40px 36px', marginLeft: -24, marginRight: -24, marginTop: -24 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(251,249,245,0.4)', margin: '0 0 8px' }}>
          <Link href={`/workspace/events/${id}`} style={{ color: 'inherit', textDecoration: 'none' }}>{event.title}</Link> / Operational Teams
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: '0 0 8px', fontSize: 'clamp(1.3rem,2.5vw,1.9rem)', fontWeight: 700 }}>Operational Teams</h1>
            <p style={{ margin: 0, color: 'rgba(251,249,245,0.65)', fontSize: 15 }}>
              {normalizedMembers.length} member{normalizedMembers.length !== 1 ? 's' : ''} across 12 confirmed teams.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <Link href={`/workspace/events/${id}`} style={{ padding: '6px 14px', borderRadius: 4, background: 'rgba(251,249,245,0.1)', color: 'rgba(251,249,245,0.8)', textDecoration: 'none', fontSize: 13 }}>Overview</Link>
          <Link href={`/workspace/events/${id}/tasks`} style={{ padding: '6px 14px', borderRadius: 4, background: 'rgba(251,249,245,0.1)', color: 'rgba(251,249,245,0.8)', textDecoration: 'none', fontSize: 13 }}>Task Board</Link>
        </div>
      </div>

      <div style={{ marginTop: 32 }}>
        <EventTeamsClient
          eventId={id}
          teams={teams ?? []}
          initialMembers={normalizedMembers}
          candidates={(candidates as { id: string; full_name: string; designation: string | null; role: string }[]) ?? []}
          canManage={Boolean(canManage)}
        />
      </div>
    </>
  );
}
