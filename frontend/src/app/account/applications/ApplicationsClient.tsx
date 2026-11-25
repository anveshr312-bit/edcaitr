'use client';

import { useState } from 'react';

interface Application {
  id: string;
  application_type: string;
  status: string;
  statement: string | null;
  created_at: string;
  applicant_id: string;
  profiles: { full_name: string; college: string | null; designation: string | null } | null;
}

interface Props {
  applications: Application[];
}

export default function ApplicationsClient({ applications: initial }: Props) {
  const [apps, setApps] = useState<Application[]>(initial);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});

  async function decide(app: Application, decision: 'approved' | 'rejected') {
    const note = notes[app.id]?.trim() ?? '';
    if (!note) {
      setMessages(m => ({ ...m, [app.id]: 'Please enter a review note before deciding.' }));
      return;
    }
    const previousApps = apps;
    // Optimistic UI: remove reviewed application immediately, rollback if server fails
    setApps(prev => prev.filter(a => a.id !== app.id));
    setBusy(b => ({ ...b, [app.id]: true }));
    setMessages(m => ({ ...m, [app.id]: '' }));
    try {
      const res = await fetch('/api/applications/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: app.id,
          applicationType: app.application_type,
          decision,
          note,
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error ?? 'Action failed.');
      }
      setMessages(m => ({ ...m, [app.id]: `${decision === 'approved' ? 'Approved' : 'Rejected'} successfully.` }));
    } catch (err) {
      setApps(previousApps);
      setMessages(m => ({
        ...m,
        [app.id]: err instanceof Error ? err.message : 'Action failed.',
      }));
    } finally {
      setBusy(b => ({ ...b, [app.id]: false }));
    }
  }

  if (apps.length === 0) {
    return <p style={{ color: '#555' }}>No pending applications to review.</p>;
  }

  return (
    <section style={{ display: 'grid', gap: 20 }}>
      {apps.map(app => {
        const profile = app.profiles;
        const isBusy = busy[app.id] ?? false;
        return (
          <article
            key={app.id}
            style={{ border: '1px solid #ccd2da', borderRadius: 8, padding: 20 }}
          >
            <header style={{ marginBottom: 12 }}>
              <strong>{profile?.full_name || 'Unknown'}</strong>
              {profile?.college && <span style={{ color: '#555', marginLeft: 8, fontSize: 13 }}>{profile.college}</span>}
              {profile?.designation && <span style={{ color: '#555', marginLeft: 8, fontSize: 13 }}>· {profile.designation}</span>}
              <span style={{ float: 'right', fontSize: 13, color: '#777' }}>
                {app.application_type.replace(/_/g, ' ')} ·{' '}
                {new Date(app.created_at).toLocaleDateString('en-IN')}
              </span>
            </header>
            {app.statement && (
              <blockquote style={{ margin: '0 0 16px', padding: '10px 14px', background: '#f5f7fa', borderLeft: '3px solid #ccd2da', borderRadius: 4, fontSize: 14 }}>
                {app.statement}
              </blockquote>
            )}
            <label style={{ marginBottom: 8 }}>
              Review note (required)
              <textarea
                rows={2}
                maxLength={500}
                value={notes[app.id] ?? ''}
                onChange={e => setNotes(n => ({ ...n, [app.id]: e.target.value }))}
                placeholder="State your reason for approving or rejecting."
                style={{ font: 'inherit', padding: 8, resize: 'vertical' }}
                disabled={isBusy}
              />
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => void decide(app, 'approved')}
                disabled={isBusy}
                style={{ background: '#2e7d32', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 20px', cursor: 'pointer' }}
              >
                {isBusy ? '…' : 'Approve'}
              </button>
              <button
                onClick={() => void decide(app, 'rejected')}
                disabled={isBusy}
                style={{ background: '#c62828', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 20px', cursor: 'pointer' }}
              >
                {isBusy ? '…' : 'Reject'}
              </button>
            </div>
            {messages[app.id] && (
              <p role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 13, color: '#c62828' }}>
                {messages[app.id]}
              </p>
            )}
          </article>
        );
      })}
    </section>
  );
}
