'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { createClient } from '../../../lib/supabase/client';

type AppType = 'core_team_application' | 'advisor_application' | 'alumni_verification';
type AppRole = 'participant' | 'core_team' | 'advisor' | 'director' | 'alumni';

const APP_OPTIONS: { type: AppType; label: string; description: string; requiredRole: AppRole }[] = [
  {
    type: 'core_team_application',
    label: 'Core Team membership',
    description: 'Apply to become an approved E-Cell Core Team member. Reviewed by an Advisor.',
    requiredRole: 'participant',
  },
  {
    type: 'advisor_application',
    label: 'Advisor application',
    description: 'Apply to become an Advisor. Reviewed by the Director.',
    requiredRole: 'participant',
  },
  {
    type: 'alumni_verification',
    label: 'Alumni Connect access',
    description: 'Verify your former E-Cell membership to gain Alumni Connect access.',
    requiredRole: 'participant',
  },
];

interface OwnApplication {
  id: string;
  application_type: AppType;
  status: string;
  created_at: string;
  review_note: string | null;
}

export default function ApplyPage() {
  const [supabase] = useState(() => createClient());
  const [userId, setUserId] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<AppRole>('participant');
  const [ownApplications, setOwnApplications] = useState<OwnApplication[]>([]);
  const [selected, setSelected] = useState<AppType | null>(null);
  const [statement, setStatement] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { setLoading(false); return; }
      setUserId(data.user.id);

      const [roleRes, appsRes] = await Promise.all([
        supabase.rpc('get_user_role', { user_uuid: data.user.id }),
        supabase
          .from('applications')
          .select('id, application_type, status, created_at, review_note')
          .eq('applicant_id', data.user.id)
          .order('created_at', { ascending: false }),
      ]);

      if (roleRes.data) setCurrentRole(roleRes.data as AppRole);
      if (appsRes.data) setOwnApplications(appsRes.data as OwnApplication[]);
      setLoading(false);
    });
  }, [supabase]);

  const hasPending = (type: AppType) =>
    ownApplications.some(a => a.application_type === type && a.status === 'pending');

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase || !selected || !userId) return;
    setBusy(true); setMessage(''); setIsError(false);
    try {
      const { error } = await supabase.from('applications').insert({
        applicant_id: userId,
        application_type: selected,
        status: 'pending',
        statement: statement.trim(),
      });
      if (error) throw error;
      setMessage('Application submitted. You will be notified when it is reviewed.');
      setStatement('');
      setSelected(null);
      // Refresh own applications
      const { data: updated } = await supabase
        .from('applications')
        .select('id, application_type, status, created_at, review_note')
        .eq('applicant_id', userId)
        .order('created_at', { ascending: false });
      if (updated) setOwnApplications(updated as OwnApplication[]);
    } catch (err) {
      setIsError(true);
      setMessage(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p>Loading…</p>;
  if (!userId) return <p>Please <a href="/account">sign in</a> to apply.</p>;

  const statusColor: Record<string, string> = {
    pending: '#e65100', approved: '#2e7d32', rejected: '#c62828', suspended: '#c62828',
  };

  return (
    <>
      <h1>Apply for a role</h1>
      <p style={{ color: '#555', marginBottom: 24 }}>
        Current role: <strong>{currentRole}</strong>. Administrative roles require approval and do not change your participant access.
      </p>

      {/* Existing applications */}
      {ownApplications.length > 0 && (
        <section>
          <h2>Your applications</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ccd2da' }}>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>Type</th>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>Submitted</th>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>Note</th>
              </tr>
            </thead>
            <tbody>
              {ownApplications.map(app => (
                <tr key={app.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <td style={{ padding: '8px 12px' }}>{app.application_type.replace(/_/g, ' ')}</td>
                  <td style={{ padding: '8px 12px', color: statusColor[app.status] ?? '#333', fontWeight: 600 }}>
                    {app.status}
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    {new Date(app.created_at).toLocaleDateString('en-IN')}
                  </td>
                  <td style={{ padding: '8px 12px', color: '#555' }}>{app.review_note ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Application form */}
      <section style={{ marginTop: 32 }}>
        <h2>Submit a new application</h2>
        <form onSubmit={submit}>
          <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
            <legend style={{ fontWeight: 600, marginBottom: 12 }}>Select application type</legend>
            {APP_OPTIONS.map(opt => {
              const pending = hasPending(opt.type);
              return (
                <label
                  key={opt.type}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '12px 16px', border: `2px solid ${selected === opt.type ? '#174bba' : '#ccd2da'}`,
                    borderRadius: 6, marginBottom: 8, cursor: pending ? 'not-allowed' : 'pointer',
                    opacity: pending ? 0.6 : 1,
                  }}
                >
                  <input
                    type="radio"
                    name="type"
                    value={opt.type}
                    disabled={pending}
                    checked={selected === opt.type}
                    onChange={() => setSelected(opt.type)}
                    style={{ marginTop: 2 }}
                  />
                  <span>
                    <strong>{opt.label}</strong>
                    {pending && <span style={{ color: '#e65100', marginLeft: 8, fontSize: 12 }}>(pending)</span>}
                    <br />
                    <span style={{ fontSize: 13, color: '#555' }}>{opt.description}</span>
                  </span>
                </label>
              );
            })}
          </fieldset>

          {selected && (
            <label style={{ marginTop: 16 }}>
              Supporting statement
              <textarea
                required
                minLength={20}
                maxLength={2000}
                rows={5}
                value={statement}
                onChange={e => setStatement(e.target.value)}
                placeholder="Briefly explain your background and motivation (minimum 20 characters)."
                style={{ font: 'inherit', padding: 10, resize: 'vertical' }}
              />
              <span style={{ fontSize: 12, color: '#777' }}>{statement.length}/2000</span>
            </label>
          )}

          <button type="submit" disabled={!selected || busy || statement.length < 20}>
            {busy ? 'Submitting…' : 'Submit application'}
          </button>
        </form>
      </section>

      {message && (
        <p role="status" aria-live="polite" style={{ color: isError ? '#c62828' : '#2e7d32', marginTop: 12 }}>
          {message}
        </p>
      )}

      <p style={{ marginTop: 24 }}>
        <a href="/account/dashboard">← Back to dashboard</a>
      </p>
    </>
  );
}
