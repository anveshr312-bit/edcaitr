'use client';

import { useMemo, useState, type FormEvent } from 'react';

interface TeamDef {
  code: string;
  name: string;
}

interface Task {
  id: string;
  team_code: string;
  title: string;
  brief: string;
  deliverable_spec: string | null;
  assignee_id: string | null;
  status: string;
  blocker_note: string | null;
  submission_url: string | null;
  due_at: string | null;
}

interface Assignee {
  id: string;
  full_name: string;
}

export default function EventTasksClient({
  eventId,
  teams,
  initialTasks,
  assignees,
  canManage,
}: {
  eventId: string;
  teams: TeamDef[];
  initialTasks: Task[];
  assignees: Assignee[];
  canManage: boolean;
}) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [filterTeam, setFilterTeam] = useState('ALL');
  const [title, setTitle] = useState('');
  const [teamCode, setTeamCode] = useState(teams[0]?.code ?? 'RD');
  const [brief, setBrief] = useState('');
  const [deliverableSpec, setDeliverableSpec] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [submissionDrafts, setSubmissionDrafts] = useState<Record<string, string>>({});
  const [blockerDrafts, setBlockerDrafts] = useState<Record<string, string>>({});

  async function createTask(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const res = await fetch(`/api/events/${eventId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          team_code: teamCode,
          brief,
          deliverable_spec: deliverableSpec,
          assignee_id: assigneeId || null,
          due_at: dueAt ? new Date(dueAt).toISOString() : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create task.');
      setTasks((prev) => [data.task, ...prev]);
      setTitle('');
      setBrief('');
      setDeliverableSpec('');
      setAssigneeId('');
      setDueAt('');
      setMessage('Task created.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to create task.');
    } finally {
      setBusy(false);
    }
  }

  async function updateTask(
    taskId: string,
    payload: { status?: string; submission_url?: string; blocker_note?: string | null }
  ) {
    setMessage('');
    const previousTasks = tasks;
    // Optimistic update: reflect status/submission/blocker immediately
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              ...(payload.status !== undefined ? { status: payload.status } : {}),
              ...(payload.submission_url !== undefined ? { submission_url: payload.submission_url } : {}),
              ...(payload.blocker_note !== undefined ? { blocker_note: payload.blocker_note } : {}),
            }
          : t
      )
    );
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to update task.');
      setTasks((prev) => prev.map((t) => (t.id === taskId ? data.task : t)));
    } catch (err) {
      setTasks(previousTasks);
      setMessage(err instanceof Error ? err.message : 'Update failed.');
    }
  }

  const visibleTasks = useMemo(
    () => tasks.filter((t) => filterTeam === 'ALL' || t.team_code === filterTeam),
    [tasks, filterTeam]
  );

  return (
    <div style={{ display: 'grid', gap: 28 }}>
      {canManage && (
        <section className="card" style={{ maxWidth: 600 }}>
          <h2>Assign New Task</h2>
          <form onSubmit={createTask} style={{ maxWidth: '100%' }}>
            <label>
              Task Title *
              <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label>
                Operational Team
                <select value={teamCode} onChange={(e) => setTeamCode(e.target.value)}>
                  {teams.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Specific Owner (optional)
                <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
                  <option value="">Entire team</option>
                  {assignees.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.full_name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Brief
              <textarea rows={2} value={brief} onChange={(e) => setBrief(e.target.value)} />
            </label>
            <label>
              Deliverable Spec (dimensions, copy, quantities)
              <input
                type="text"
                value={deliverableSpec}
                onChange={(e) => setDeliverableSpec(e.target.value)}
                placeholder="e.g. 16:9 podium graphic + 3 backdrops"
              />
            </label>
            <label>
              Due Date
              <input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
            </label>
            <button type="submit" disabled={busy}>
              {busy ? 'Creating…' : 'Create Task'}
            </button>
          </form>
        </section>
      )}

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>Tasks ({visibleTasks.length})</h2>
          <select value={filterTeam} onChange={(e) => setFilterTeam(e.target.value)} style={{ maxWidth: 260 }}>
            <option value="ALL">All operational teams</option>
            {teams.map((t) => (
              <option key={t.code} value={t.code}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {message && (
          <p role="status" aria-live="polite" style={{ color: 'var(--accent-ink)' }}>
            {message}
          </p>
        )}

        {visibleTasks.length === 0 ? (
          <div className="card">
            <p className="card-meta" style={{ margin: 0 }}>
              No tasks match this filter.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {visibleTasks.map((task) => {
              const owner = assignees.find((a) => a.id === task.assignee_id);
              return (
                <article key={task.id} id={`task-${task.id}`} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <span className="badge badge-accent">{task.status.replace('_', ' ')}</span>
                    <span className="mono-meta">
                      {task.team_code}
                      {owner ? ` · ${owner.full_name}` : ''}
                      {task.due_at ? ` · Due ${new Date(task.due_at).toLocaleDateString('en-IN')}` : ''}
                    </span>
                  </div>
                  <h3 style={{ margin: 0 }}>{task.title}</h3>
                  {task.brief && <p className="card-meta" style={{ margin: 0 }}>{task.brief}</p>}
                  {task.deliverable_spec && (
                    <p className="mono-meta" style={{ margin: 0 }}>
                      Deliverable: {task.deliverable_spec}
                    </p>
                  )}
                  {task.submission_url && (
                    <a href={task.submission_url} target="_blank" rel="noopener noreferrer">
                      Submitted asset link
                    </a>
                  )}
                  {task.blocker_note && (
                    <p style={{ margin: 0, color: 'var(--danger)', fontSize: '0.9rem' }}>
                      Blocker: {task.blocker_note}
                    </p>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                    {task.status === 'todo' && (
                      <button type="button" disabled={busy} onClick={() => void updateTask(task.id, { status: 'in_progress' })}>
                        Start work
                      </button>
                    )}
                    {(task.status === 'in_progress' || task.status === 'changes_requested') && (
                      <>
                        <input
                          type="url"
                          placeholder="Drive / asset URL (optional)"
                          value={submissionDrafts[task.id] ?? task.submission_url ?? ''}
                          onChange={(e) => setSubmissionDrafts((d) => ({ ...d, [task.id]: e.target.value }))}
                          style={{ minWidth: 220 }}
                        />
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            void updateTask(task.id, {
                              status: 'submitted',
                              submission_url: submissionDrafts[task.id] ?? task.submission_url ?? undefined,
                            })
                          }
                        >
                          Submit for review
                        </button>
                      </>
                    )}
                    {canManage && task.status === 'submitted' && (
                      <>
                        <button
                          type="button"
                          className="btn-primary"
                          disabled={busy}
                          onClick={() => void updateTask(task.id, { status: 'approved' })}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void updateTask(task.id, { status: 'changes_requested' })}
                        >
                          Request changes
                        </button>
                      </>
                    )}
                    <input
                      type="text"
                      placeholder="Report a blocker..."
                      value={blockerDrafts[task.id] ?? ''}
                      onChange={(e) => setBlockerDrafts((d) => ({ ...d, [task.id]: e.target.value }))}
                    />
                    <button
                      type="button"
                      disabled={busy || !(blockerDrafts[task.id]?.trim())}
                      onClick={() => {
                        void updateTask(task.id, { blocker_note: blockerDrafts[task.id]?.trim() ?? '' });
                        setBlockerDrafts((d) => ({ ...d, [task.id]: '' }));
                      }}
                    >
                      Report blocker
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
