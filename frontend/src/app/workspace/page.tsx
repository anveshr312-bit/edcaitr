import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import { getUserRole } from '../../lib/auth/authorization';

export const dynamic = 'force-dynamic';

export default async function WorkspaceHomePage() {
  const supabase = await createClient();
  if (!supabase) redirect('/account');

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect('/account');

  const role = await getUserRole(user.id);
  if (!['core_team', 'advisor', 'director'].includes(role)) {
    redirect('/account/dashboard');
  }

  const [{ data: myTeams }, { data: myTasks }, { data: events }] = await Promise.all([
    supabase
      .from('event_team_members')
      .select('id, event_id, team_code, is_coordinator, operational_teams(name), events(id, title, starts_at)')
      .eq('user_id', user.id),
    supabase
      .from('tasks')
      .select('id, event_id, team_code, title, status, blocker_note, due_at, events(title)')
      .order('due_at', { ascending: true, nullsFirst: false }),
    supabase
      .from('events')
      .select('id, title, status, starts_at')
      .order('starts_at', { ascending: false, nullsFirst: false }),
  ]);

  const openTasks = (myTasks ?? []).filter((t) => t.status !== 'approved');

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>My Event Work</h1>
          <p className="card-meta" style={{ margin: 0 }}>
            Your assigned operational teams, active tasks, and accessible event workspaces.
          </p>
        </div>
        <Link href="/workspace/events" className="btn btn-primary">
          Event Management
        </Link>
      </div>

      <section>
        <h2>Assigned Operational Teams</h2>
        {!myTeams || myTeams.length === 0 ? (
          <div className="card">
            <p className="card-meta" style={{ margin: 0 }}>
              You have not been assigned to any operational teams yet.
            </p>
          </div>
        ) : (
          <div className="grid">
            {myTeams.map((m) => {
              const ev = Array.isArray(m.events) ? m.events[0] : m.events;
              const team = Array.isArray(m.operational_teams) ? m.operational_teams[0] : m.operational_teams;
              return (
                <article key={m.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="badge badge-accent">{team?.name ?? m.team_code}</span>
                    {m.is_coordinator && <span className="badge">Coordinator</span>}
                  </div>
                  <h3 style={{ margin: 0 }}>{ev?.title ?? 'Event'}</h3>
                  <div style={{ display: 'flex', gap: 12, marginTop: 'auto', paddingTop: 8 }}>
                    <Link href={`/workspace/events/${m.event_id}/tasks`}>Tasks</Link>
                    <Link href={`/workspace/events/${m.event_id}/teams`}>Team</Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2>Active Tasks ({openTasks.length})</h2>
        {openTasks.length === 0 ? (
          <div className="card">
            <p className="card-meta" style={{ margin: 0 }}>
              No open tasks in your accessible events.
            </p>
          </div>
        ) : (
          <div className="grid">
            {openTasks.map((task) => {
              const ev = Array.isArray(task.events) ? task.events[0] : task.events;
              return (
                <article key={task.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="badge badge-accent">{task.status.replace('_', ' ')}</span>
                    <span className="mono-meta">{task.team_code}</span>
                  </div>
                  <h3 style={{ margin: 0 }}>{task.title}</h3>
                  <p className="card-meta" style={{ margin: 0 }}>{ev?.title ?? 'Event'}</p>
                  {task.blocker_note && (
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--danger)' }}>
                      Blocker: {task.blocker_note}
                    </p>
                  )}
                  <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                    <Link href={`/workspace/events/${task.event_id}/tasks`}>Open task board</Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {events && events.length > 0 && (
        <section>
          <h2>Accessible Events</h2>
          <div className="grid">
            {events.map((ev) => (
              <article key={ev.id} className="card">
                <span className="badge">{ev.status}</span>
                <h3 style={{ margin: 0 }}>{ev.title}</h3>
                <div style={{ display: 'flex', gap: 12, marginTop: 'auto', paddingTop: 8 }}>
                  <Link href={`/workspace/events/${ev.id}`}>Overview</Link>
                  <Link href={`/workspace/events/${ev.id}/teams`}>Teams</Link>
                  <Link href={`/workspace/events/${ev.id}/tasks`}>Tasks</Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
