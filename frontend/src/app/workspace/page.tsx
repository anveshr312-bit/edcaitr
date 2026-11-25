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
  const blockedTasks = openTasks.filter(t => t.blocker_note);

  return (
    <>
      {/* Light header card */}
      <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-panel)', padding: 'clamp(24px, 3.5vw, 36px)', margin: 0 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 'var(--radius-control)', background: 'var(--accent-tint)', border: '1px solid rgba(192,30,48,0.2)', marginBottom: 10 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-3-accent-personality)' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-3-accent-personality)' }}>
            Workspace · {role.replace('_', ' ')}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: '0 0 6px', fontSize: 'clamp(1.5rem, 2.8vw, 2.2rem)', fontWeight: 700, lineHeight: 1.15, color: 'var(--text-primary)' }}>
              My Event Work
            </h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14, maxWidth: 540, lineHeight: 1.6 }}>
              Assigned operational teams, active tasks, and accessible event workspaces.
            </p>
          </div>
          <Link href="/workspace/events" className="btn btn-primary" style={{ fontSize: 13 }}>
            Event Management →
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 16, marginTop: 24 }}>
        <div className="card" style={{ textAlign: 'center', padding: '18px 12px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{(myTeams ?? []).length}</div>
          <div className="card-meta" style={{ margin: 0, fontSize: 12 }}>Team Assignments</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '18px 12px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: openTasks.length > 0 ? 'var(--color-3-accent-personality)' : 'var(--success)' }}>{openTasks.length}</div>
          <div className="card-meta" style={{ margin: 0, fontSize: 12 }}>Open Tasks</div>
        </div>
        {blockedTasks.length > 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '18px 12px', borderLeft: '3px solid var(--danger)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--danger)' }}>{blockedTasks.length}</div>
            <div className="card-meta" style={{ margin: 0, fontSize: 12 }}>Blocked</div>
          </div>
        )}
        <div className="card" style={{ textAlign: 'center', padding: '18px 12px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{(events ?? []).length}</div>
          <div className="card-meta" style={{ margin: 0, fontSize: 12 }}>Total Events</div>
        </div>
      </div>

      {/* Assigned teams */}
      <section style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.02em', color: 'var(--text-muted)', margin: '0 0 16px', borderLeft: '3px solid var(--color-3-accent-personality)', paddingLeft: 12 }}>
          Assigned Operational Teams
        </h2>
        {!myTeams || myTeams.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '32px 24px' }}>
            <p className="card-meta" style={{ margin: 0 }}>No team assignments yet. Contact your Advisor or Event Lead to be assigned.</p>
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
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>{ev?.title ?? 'Event'}</h3>
                  {ev?.starts_at && <p className="mono-meta" style={{ margin: 0 }}>{new Date(ev.starts_at).toLocaleDateString('en-IN')}</p>}
                  <div style={{ display: 'flex', gap: 12, marginTop: 'auto', paddingTop: 10 }}>
                    <Link href={`/workspace/events/${m.event_id}/tasks`} style={{ fontSize: 13, color: 'var(--color-3-accent-personality)', textDecoration: 'none', fontWeight: 600 }}>Tasks →</Link>
                    <Link href={`/workspace/events/${m.event_id}/teams`} style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>Team →</Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Open tasks */}
      <section style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.02em', color: 'var(--text-muted)', margin: '0 0 16px', borderLeft: '3px solid var(--color-3-accent-personality)', paddingLeft: 12 }}>
          Open Tasks ({openTasks.length})
        </h2>
        {openTasks.length === 0 ? (
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <p className="card-meta" style={{ margin: 0 }}>All caught up — no open tasks.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {openTasks.map((task) => {
              const ev = Array.isArray(task.events) ? task.events[0] : task.events;
              const isBlocked = Boolean(task.blocker_note);
              return (
                <div key={task.id} className="card" style={{ padding: '14px 18px', borderLeft: isBlocked ? '3px solid var(--danger)' : undefined, display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: isBlocked ? 'var(--danger)' : 'var(--accent-ink)' }}>{task.status.replace('_', ' ')}</span>
                      <span className="mono-meta">{task.team_code}</span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 4 }}>{task.title}</div>
                    <div className="card-meta" style={{ margin: 0, fontSize: 13 }}>{ev?.title ?? 'Event'}</div>
                    {task.blocker_note && (
                      <div style={{ marginTop: 6, fontSize: 13, color: 'var(--danger)', fontStyle: 'italic' }}>
                        Blocked: {task.blocker_note}
                      </div>
                    )}
                  </div>
                  <Link href={`/workspace/events/${task.event_id}/tasks`} style={{ fontSize: 13, color: 'var(--color-3-accent-personality)', textDecoration: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    Task board →
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
