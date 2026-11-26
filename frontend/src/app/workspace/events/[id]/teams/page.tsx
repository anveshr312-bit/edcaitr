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

  // Enforce governance: Advisors and Directors are not student operators; exclude them from team candidate assignment
  const studentCandidates = ((candidates as { id: string; full_name: string; designation: string | null; role: string }[]) ?? []).filter(
    (c) => c.role !== 'director' && c.role !== 'advisor'
  );

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
      {/* Light header card */}
      <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-panel)', padding: 'clamp(24px, 3.5vw, 36px)', margin: 0 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 'var(--radius-control)', background: 'var(--accent-tint)', border: '1px solid rgba(192,30,48,0.2)', marginBottom: 10 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-3-accent-personality)' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-3-accent-personality)' }}>
            <Link href={`/workspace/events/${id}`} style={{ color: 'inherit', textDecoration: 'none' }}>{event.title}</Link> / Teams
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: '0 0 6px', fontSize: 'clamp(1.4rem, 2.6vw, 2rem)', fontWeight: 700, color: 'var(--text-primary)' }}>Operational Teams</h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>
              {normalizedMembers.length} member{normalizedMembers.length !== 1 ? 's' : ''} across 12 confirmed teams.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <Link href={`/workspace/events/${id}`} style={{ padding: '6px 14px', borderRadius: 'var(--radius-control)', background: 'var(--surface-subtle)', color: 'var(--text-secondary)', border: '1px solid var(--border-hairline)', textDecoration: 'none', fontSize: 13 }}>Overview</Link>
          <Link href={`/workspace/events/${id}/tasks`} style={{ padding: '6px 14px', borderRadius: 'var(--radius-control)', background: 'var(--surface-subtle)', color: 'var(--text-secondary)', border: '1px solid var(--border-hairline)', textDecoration: 'none', fontSize: 13 }}>Task Board</Link>
        </div>
      </div>

      <div style={{ marginTop: 32 }}>
        <EventTeamsClient
          eventId={id}
          teams={teams ?? []}
          initialMembers={normalizedMembers}
          candidates={studentCandidates}
          canManage={Boolean(canManage)}
        />
      </div>
    </>
  );
}
