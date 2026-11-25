import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '../../../../../lib/supabase/server';
import { getUserRole } from '../../../../../lib/auth/authorization';
import EventTasksClient from './EventTasksClient';

export const dynamic = 'force-dynamic';

export default async function EventTasksPage({
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

  const [{ data: event }, { data: teams }, { data: tasks }, { data: members }, { data: canManage }] =
    await Promise.all([
      supabase.from('events').select('id, title').eq('id', id).maybeSingle(),
      supabase.from('operational_teams').select('code, name').order('display_order'),
      supabase
        .from('tasks')
        .select('id, team_code, title, brief, deliverable_spec, assignee_id, status, blocker_note, submission_url, due_at')
        .eq('event_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('event_team_members')
        .select('user_id, team_code, profiles!user_id(full_name)')
        .eq('event_id', id),
      supabase.rpc('can_manage_event', { p_event_id: id, p_user_id: user.id }),
    ]);

  if (!event) notFound();

  const assignees = Array.from(
    new Map(
      (members ?? []).map((m) => {
        const p = Array.isArray(m.profiles) ? (m.profiles[0] ?? null) : (m.profiles ?? null);
        return [
          String(m.user_id),
          { id: String(m.user_id), full_name: p?.full_name ? String(p.full_name) : 'Unnamed' },
        ];
      })
    ).values()
  );

  const openCount = (tasks ?? []).filter(t => t.status !== 'approved').length;
  const blockedCount = (tasks ?? []).filter(t => t.blocker_note).length;

  return (
    <>
      {/* Header */}
      <div style={{ background: 'var(--color-2-mood)', color: 'var(--color-1-mood)', padding: '40px 36px', marginLeft: -24, marginRight: -24, marginTop: -24 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(251,249,245,0.4)', margin: '0 0 8px' }}>
          <Link href={`/workspace/events/${id}`} style={{ color: 'inherit', textDecoration: 'none' }}>{event.title}</Link> / Task Board
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.3rem,2.5vw,1.9rem)', fontWeight: 700 }}>Task Board</h1>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, lineHeight: 1 }}>{openCount}</div>
              <div style={{ fontSize: 11, color: 'rgba(251,249,245,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>open</div>
            </div>
            {blockedCount > 0 && (
              <div style={{ textAlign: 'right', color: 'var(--color-3-accent-personality)' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, lineHeight: 1 }}>{blockedCount}</div>
                <div style={{ fontSize: 11, color: 'rgba(224,72,38,0.7)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>blocked</div>
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <Link href={`/workspace/events/${id}`} style={{ padding: '6px 14px', borderRadius: 4, background: 'rgba(251,249,245,0.1)', color: 'rgba(251,249,245,0.8)', textDecoration: 'none', fontSize: 13 }}>Overview</Link>
          <Link href={`/workspace/events/${id}/teams`} style={{ padding: '6px 14px', borderRadius: 4, background: 'rgba(251,249,245,0.1)', color: 'rgba(251,249,245,0.8)', textDecoration: 'none', fontSize: 13 }}>Teams</Link>
        </div>
      </div>

      <div style={{ marginTop: 32 }}>
        <EventTasksClient
          eventId={id}
          teams={teams ?? []}
          initialTasks={tasks ?? []}
          assignees={assignees}
          canManage={Boolean(canManage)}
        />
      </div>
    </>
  );
}
