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

  return (
    <>
      <p style={{ marginBottom: 16 }}>
        <Link href={`/workspace/events/${id}`}>← Event overview</Link> ·{' '}
        <Link href={`/workspace/events/${id}/teams`}>Operational teams</Link>
      </p>
      <h1>Task Board: {event.title}</h1>
      <EventTasksClient
        eventId={id}
        teams={teams ?? []}
        initialTasks={tasks ?? []}
        assignees={assignees}
        canManage={Boolean(canManage)}
      />
    </>
  );
}
