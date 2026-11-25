import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import { getUserRole } from '../../../lib/auth/authorization';
import ApplicationsClient from './ApplicationsClient';

export default async function ApplicationsPage() {
  const supabase = await createClient();
  if (!supabase) redirect('/account');

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect('/account');

  const role = await getUserRole(user.id);
  if (role !== 'advisor' && role !== 'director') redirect('/account/dashboard');

  const isDirector = role === 'director';
  const allowedTypes = isDirector
    ? ['advisor_application', 'core_team_application', 'alumni_verification', 'promotion_nomination']
    : ['core_team_application', 'alumni_verification'];

  const { data: applications } = await supabase
    .from('applications')
    .select(`
      id, application_type, status, statement, created_at,
      applicant_id,
      profiles!applicant_id (full_name, college, designation)
    `)
    .in('application_type', allowedTypes)
    .eq('status', 'pending')
    .is('reviewed_at', null)
    .order('created_at', { ascending: true });

  const normalized = (applications ?? []).map((app) => ({
    id: String(app.id),
    application_type: String(app.application_type),
    status: String(app.status),
    statement: app.statement ? String(app.statement) : null,
    created_at: String(app.created_at),
    applicant_id: String(app.applicant_id),
    profiles: Array.isArray(app.profiles)
      ? (app.profiles[0] ?? null)
      : (app.profiles ?? null),
  }));

  return (
    <div style={{ display: 'grid', gap: 32 }}>
      {/* Light header card */}
      <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-panel)', padding: 'clamp(24px, 3.5vw, 36px)', margin: 0 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 'var(--radius-control)', background: 'var(--accent-tint)', border: '1px solid rgba(224,72,38,0.2)', marginBottom: 10 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-3-accent-personality)' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-3-accent-personality)' }}>
            {isDirector ? 'Director Review' : 'Advisor Review'}
          </span>
        </div>
        <h1 style={{ margin: '0 0 8px', fontSize: 'clamp(1.5rem, 2.8vw, 2.2rem)', fontWeight: 700, lineHeight: 1.15, color: 'var(--text-primary)' }}>
          Pending Applications
        </h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14, maxWidth: 560, lineHeight: 1.6 }}>
          {isDirector
            ? 'All pending candidate applications across every role type.'
            : 'Review Core Team membership applications and Alumni Connect requests.'}
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 16 }}>
        <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-3-accent-personality)' }}>{normalized.length}</div>
          <div className="card-meta" style={{ margin: 0, fontSize: 12 }}>Awaiting Review</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{normalized.filter(a => a.application_type === 'core_team_application').length}</div>
          <div className="card-meta" style={{ margin: 0, fontSize: 12 }}>Core Team</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{normalized.filter(a => a.application_type === 'alumni_verification').length}</div>
          <div className="card-meta" style={{ margin: 0, fontSize: 12 }}>Alumni</div>
        </div>
        {isDirector && (
          <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{normalized.filter(a => a.application_type === 'advisor_application').length}</div>
            <div className="card-meta" style={{ margin: 0, fontSize: 12 }}>Advisor</div>
          </div>
        )}
      </div>

      {/* Applications list */}
      <section>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', margin: '0 0 16px', borderLeft: '3px solid var(--color-3-accent-personality)', paddingLeft: 12 }}>
          Applications Queue
        </h2>
        <ApplicationsClient applications={normalized} />
      </section>

      <p>
        <a href="/account/dashboard" style={{ color: 'var(--text-muted)', fontSize: 14, textDecoration: 'none' }}>
          ← Back to dashboard
        </a>
      </p>
    </div>
  );
}
