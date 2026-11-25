'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { createClient } from '../../../lib/supabase/client';

type AppType = 'core_team_application' | 'advisor_application' | 'alumni_verification';
type AppRole = 'participant' | 'core_team' | 'advisor' | 'director' | 'alumni';

const APP_OPTIONS: { type: AppType; label: string; description: string; requiredRole: AppRole }[] = [
  {
    type: 'core_team_application',
    label: 'Core Team membership',
    description: 'Apply to become an approved EDC Core Team member. Reviewed by an Advisor.',
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
    description: 'Verify your former EDC membership to gain Alumni Connect access.',
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

const STATUS_COLOR: Record<string, string> = {
  pending: 'var(--accent-ink)',
  approved: 'var(--success)',
  rejected: 'var(--danger)',
  suspended: 'var(--danger)',
};

const STATUS_BG: Record<string, string> = {
  pending: 'rgba(192,30,48,0.08)',
  approved: 'rgba(21,128,61,0.08)',
  rejected: 'rgba(185,28,28,0.08)',
  suspended: 'rgba(185,28,28,0.08)',
};

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
    if (!supabase || !userId || !selected || statement.length < 20) return;
    setBusy(true); setMessage(''); setIsError(false);
    try {
      const { error } = await supabase.from('applications').insert({
        applicant_id: userId,
        application_type: selected,
        statement: statement.trim(),
        status: 'pending',
      });
      if (error) throw error;
      setMessage('Application submitted successfully. You will be notified of the decision.');
      setSelected(null);
      setStatement('');
      const { data } = await supabase
        .from('applications')
        .select('id, application_type, status, created_at, review_note')
        .eq('applicant_id', userId)
        .order('created_at', { ascending: false });
      if (data) setOwnApplications(data as OwnApplication[]);
    } catch (err) {
      setIsError(true);
      setMessage(err instanceof Error ? err.message : 'Submission failed.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '48px 24px', color: 'var(--text-muted)' }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
        <path d="M21 12a9 9 0 11-6.219-8.56"/>
      </svg>
      Loading…
    </div>
  );
  if (!userId) return (
    <div className="card" style={{ maxWidth: 400, margin: '48px auto', textAlign: 'center' }}>
      <p style={{ margin: 0 }}>Please <a href="/account">sign in</a> to apply.</p>
    </div>
  );

  return (
    <div style={{ display: 'grid', gap: 32 }}>
      {/* Light header card */}
      <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-panel)', padding: 'clamp(24px, 3.5vw, 36px)', margin: 0 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 'var(--radius-control)', background: 'var(--accent-tint)', border: '1px solid rgba(192,30,48,0.2)', marginBottom: 10 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-3-accent-personality)' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-3-accent-personality)' }}>
            Role Application
          </span>
        </div>
        <h1 style={{ margin: '0 0 8px', fontSize: 'clamp(1.5rem, 2.8vw, 2.2rem)', fontWeight: 700, lineHeight: 1.15, color: 'var(--text-primary)' }}>
          Apply for a Role
        </h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14, maxWidth: 560, lineHeight: 1.6 }}>
          Current role: <strong style={{ color: 'var(--text-primary)' }}>{currentRole.replace('_', ' ')}</strong>. Administrative roles require verification and governance review.
        </p>
      </div>

      {/* Existing applications */}
      {ownApplications.length > 0 && (
        <section>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', margin: '0 0 16px', borderLeft: '3px solid var(--color-3-accent-personality)', paddingLeft: 12 }}>
            Your Applications
          </h2>
          <div style={{ display: 'grid', gap: 12 }}>
            {ownApplications.map(app => (
              <div key={app.id} className="card" style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start' }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{app.application_type.replace(/_/g, ' ')}</div>
                  <div className="mono-meta" style={{ margin: 0 }}>{new Date(app.created_at).toLocaleDateString('en-IN')}</div>
                  {app.review_note && (
                    <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      Note: {app.review_note}
                    </div>
                  )}
                </div>
                <span style={{ background: STATUS_BG[app.status] ?? 'var(--surface-subtle)', color: STATUS_COLOR[app.status] ?? 'var(--text-primary)', padding: '4px 10px', borderRadius: 4, fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  {app.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Application form */}
      <section>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', margin: '0 0 16px', borderLeft: '3px solid var(--color-3-accent-personality)', paddingLeft: 12 }}>
          Submit a New Application
        </h2>
        <form onSubmit={submit} style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gap: 10 }}>
            {APP_OPTIONS.map(opt => {
              const pending = hasPending(opt.type);
              const isSelected = selected === opt.type;
              return (
                <label
                  key={opt.type}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 14,
                    padding: '16px 18px',
                    border: `2px solid ${isSelected ? 'var(--color-3-accent-personality)' : 'var(--border-hairline)'}`,
                    background: isSelected ? 'var(--accent-tint)' : 'var(--surface)',
                    borderRadius: 6, cursor: pending ? 'not-allowed' : 'pointer',
                    opacity: pending ? 0.6 : 1, transition: 'border-color 0.15s, background 0.15s',
                  }}
                >
                  <input
                    type="radio"
                    name="type"
                    value={opt.type}
                    disabled={pending}
                    checked={isSelected}
                    onChange={() => setSelected(opt.type)}
                    style={{ marginTop: 3, accentColor: 'var(--color-3-accent-personality)' }}
                  />
                  <span>
                    <strong style={{ display: 'block', marginBottom: 4 }}>{opt.label}</strong>
                    {pending && <span style={{ color: 'var(--accent-ink)', marginRight: 8, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Pending</span>}
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{opt.description}</span>
                  </span>
                </label>
              );
            })}
          </div>

          {selected && (
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>Supporting statement</span>
              <textarea
                required
                minLength={20}
                maxLength={2000}
                rows={5}
                value={statement}
                onChange={e => setStatement(e.target.value)}
                placeholder="Briefly explain your background and motivation (minimum 20 characters)."
                style={{ font: 'inherit', padding: '10px 14px', resize: 'vertical', border: '1.5px solid var(--border-hairline)', borderRadius: 6, background: 'var(--surface)' }}
              />
              <span style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>{statement.length}/2000</span>
            </label>
          )}

          <div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!selected || busy || statement.length < 20}
              style={{ minWidth: 180 }}
            >
              {busy ? 'Submitting…' : 'Submit Application'}
            </button>
          </div>
        </form>
      </section>

      {message && (
        <p role="status" aria-live="polite" style={{ color: isError ? 'var(--danger)' : 'var(--success)', margin: 0, fontWeight: 500 }}>
          {message}
        </p>
      )}

      <p>
        <a href="/account/dashboard" style={{ color: 'var(--text-muted)', fontSize: 14, textDecoration: 'none' }}>
          ← Back to dashboard
        </a>
      </p>
    </div>
  );
}
