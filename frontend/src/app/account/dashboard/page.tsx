import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../../lib/supabase/server';
import { getUserRole } from '../../../lib/auth/authorization';

type AppRole = 'participant' | 'core_team' | 'advisor' | 'director' | 'alumni';

const ROLE_CONFIG: Record<
  AppRole,
  { label: string; badgeClass: string; description: string }
> = {
  director: {
    label: 'Director · Super Admin',
    badgeClass: 'badge badge-accent',
    description: 'Full organization-wide authority and security oversight.',
  },
  advisor: {
    label: 'Faculty Advisor',
    badgeClass: 'badge badge-accent',
    description: 'Organization-wide guidance and team recruitment approval.',
  },
  core_team: {
    label: 'Core Team Member',
    badgeClass: 'badge',
    description: 'Approved operational member with event management access.',
  },
  alumni: {
    label: 'Verified Alumni',
    badgeClass: 'badge',
    description: 'Verified EDC AITR alumni with Alumni Connect network access.',
  },
  participant: {
    label: 'Participant',
    badgeClass: 'badge',
    description: 'Registered student/attendee account.',
  },
};

export default async function DashboardPage() {
  const supabase = await createClient();
  if (!supabase) redirect('/account');

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) redirect('/account');

  // Fetch profile, role, MFA status, and active membership in parallel
  const [profileResult, role, mfaResult, membershipResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, avatar_ref, designation, college, bio, linkedin_url, is_public')
      .eq('id', user.id)
      .single(),
    getUserRole(user.id),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    supabase
      .from('org_memberships')
      .select('role, status, effective_from')
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .is('effective_until', null)
      .maybeSingle(),
  ]);

  const profile = profileResult.data;
  const membership = membershipResult.data;
  const hasMfa = mfaResult.data?.currentLevel === 'aal2';
  const isMfaEnrolled = mfaResult.data?.nextLevel === 'aal2' || hasMfa;
  const isDirector = role === 'director';
  const needsMfaSetup = isDirector && !isMfaEnrolled;

  // Fetch pending applications count for leadership
  let pendingCount = 0;
  if (role === 'advisor' || role === 'director') {
    const { count } = await supabase
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .is('reviewed_at', null);
    pendingCount = count ?? 0;
  }

  const roleMeta = ROLE_CONFIG[role as AppRole] || ROLE_CONFIG.participant;
  const displayName = profile?.full_name || user.email?.split('@')[0] || 'User';

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', paddingBottom: 60, display: 'grid', gap: 28 }}>
      {/* Executive User Header Card */}
      <section
        className="card"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-hairline)',
          padding: 'clamp(24px, 3.5vw, 36px)',
          borderRadius: 'var(--radius-panel)',
          margin: 0,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
              <span className={roleMeta.badgeClass} style={{ fontSize: '0.75rem', letterSpacing: '0.04em' }}>
                {roleMeta.label}
              </span>
              {isDirector && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-control)',
                    background: hasMfa ? 'rgba(34,197,94,0.1)' : 'rgba(192,30,48,0.1)',
                    color: hasMfa ? 'var(--success)' : 'var(--color-3-accent-personality)',
                    border: `1px solid ${hasMfa ? 'rgba(34,197,94,0.25)' : 'rgba(192,30,48,0.25)'}`,
                    fontWeight: 600,
                  }}
                >
                  {hasMfa ? 'MFA verified' : isMfaEnrolled ? 'MFA verification required' : 'MFA setup needed'}
                </span>
              )}
            </div>

            <h1 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', margin: '0 0 6px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {displayName}
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.875rem' }}>
              Signed in as <strong style={{ color: 'var(--text-primary)' }}>{user.email}</strong>
              {membership?.effective_from && ` · Member since ${membership.effective_from}`}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <Link
              href="/account/profile"
              className="btn"
              style={{ fontSize: '0.85rem' }}
            >
              Edit Profile
            </Link>
            <Link
              href="/account"
              className="btn"
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
              }}
            >
              Sign Out
            </Link>
          </div>
        </div>
      </section>

      {/* Director MFA Alert (if required) */}
      {needsMfaSetup && (
        <section
          className="card"
          style={{
            borderColor: 'rgba(192,30,48,0.25)',
            background: 'var(--accent-tint)',
            padding: '18px 24px',
            margin: 0,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <strong style={{ color: 'var(--color-3-accent-personality)', fontSize: '0.95rem' }}>
                Director Authenticator (TOTP) MFA Required
              </strong>
              <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Director-gated administrative actions require multi-factor authentication to be enrolled and verified each session.
              </p>
            </div>
            <Link href="/account/mfa" className="btn btn-primary" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
              Configure MFA →
            </Link>
          </div>
        </section>
      )}

      {/* Pending Application Review Alert for Advisors / Directors */}
      {pendingCount > 0 && (
        <section
          className="card"
          style={{
            borderColor: 'var(--border-hairline)',
            background: 'var(--surface-subtle)',
            padding: '18px 24px',
            margin: 0,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                {pendingCount} Pending Recruitment Application{pendingCount > 1 ? 's' : ''}
              </strong>
              <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Candidates have applied for cell roles and are awaiting review and approval.
              </p>
            </div>
            <Link href="/account/applications" className="btn btn-primary" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
              Review Applications ({pendingCount}) →
            </Link>
          </div>
        </section>
      )}

      {/* Main Command Hub Grid */}
      <section>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 16px', color: 'var(--text-primary)' }}>
          Organization Modules &amp; Services
        </h2>

        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {/* Module 1: Participant Portal & Passes */}
          <article className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-control)', background: 'var(--surface-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-3-accent-personality)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
                  <path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>
                </svg>
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 700 }}>
                Participant Portal &amp; Passes
              </h3>
              <p className="card-meta" style={{ margin: 0, lineHeight: 1.5 }}>
                Access registered events, download admission QR passes, view check-in status, and claim verified credentials.
              </p>
            </div>
            <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--border-hairline)' }}>
              <Link href="/portal" className="btn btn-primary" style={{ width: '100%', textAlign: 'center' }}>
                Open Participant Portal →
              </Link>
            </div>
          </article>

          {/* Module 2: Alumni Connect */}
          {['director', 'advisor', 'core_team', 'alumni'].includes(role) && (
            <article className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-control)', background: 'var(--surface-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-3-accent-personality)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Alumni Connect</h3>
                  <span className="badge badge-accent" style={{ fontSize: '0.7rem' }}>Private</span>
                </div>
                <p className="card-meta" style={{ margin: 0, lineHeight: 1.5 }}>
                  Private networking directory across batches, founder startup showcases, internship and co-founder opportunities, and inbox.
                </p>
              </div>
              <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--border-hairline)' }}>
                <Link href="/alumni" className="btn" style={{ width: '100%', textAlign: 'center' }}>
                  Enter Alumni Network →
                </Link>
              </div>
            </article>
          )}

          {/* Module 3: Event Workspace (My Event Work) */}
          {['core_team', 'advisor', 'director'].includes(role) && (
            <article className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-control)', background: 'var(--surface-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-3-accent-personality)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
                  </svg>
                </div>
                <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 700 }}>
                  My Event Work
                </h3>
                <p className="card-meta" style={{ margin: 0, lineHeight: 1.5 }}>
                  View assigned operational tasks across the 12 confirmed teams (RD, AV, Logistics, Stage, Clix, and more).
                </p>
              </div>
              <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--border-hairline)' }}>
                <Link href="/workspace" className="btn" style={{ width: '100%', textAlign: 'center' }}>
                  Open Workspace Tasks →
                </Link>
              </div>
            </article>
          )}

          {/* Module 4: Event Management & Closure */}
          {['core_team', 'advisor', 'director'].includes(role) && (
            <article className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-control)', background: 'var(--surface-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-3-accent-personality)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                </div>
                <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 700 }}>
                  Event Management
                </h3>
                <p className="card-meta" style={{ margin: 0, lineHeight: 1.5 }}>
                  Create new events, assign SPOCs and operational teams, upload pre-event manuals, publish highlights, and issue digital certificates.
                </p>
              </div>
              <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--border-hairline)' }}>
                <Link href="/workspace/events" className="btn" style={{ width: '100%', textAlign: 'center' }}>
                  Manage Events →
                </Link>
              </div>
            </article>
          )}

          {/* Module 5: Application Review (Advisors & Directors) */}
          {(role === 'advisor' || role === 'director') && (
            <article className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-control)', background: 'var(--surface-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-3-accent-personality)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Recruitment Applications</h3>
                  {pendingCount > 0 && (
                    <span className="badge badge-accent" style={{ fontSize: '0.7rem' }}>
                      {pendingCount} Pending
                    </span>
                  )}
                </div>
                <p className="card-meta" style={{ margin: 0, lineHeight: 1.5 }}>
                  Review candidate applications submitted for Core Team recruitment and Advisor nominations with audit-trail verification.
                </p>
              </div>
              <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--border-hairline)' }}>
                <Link href="/account/applications" className="btn" style={{ width: '100%', textAlign: 'center' }}>
                  Review Applications →
                </Link>
              </div>
            </article>
          )}

          {/* Module 6: Team & Tenure Roster */}
          {(role === 'advisor' || role === 'director') && (
            <article className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-control)', background: 'var(--surface-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-3-accent-personality)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 700 }}>
                  Team &amp; Tenure Management
                </h3>
                <p className="card-meta" style={{ margin: 0, lineHeight: 1.5 }}>
                  Inspect organizational roster, manage tenures, record promotions, and review public team visibility.
                </p>
              </div>
              <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--border-hairline)' }}>
                <Link href="/account/team" className="btn" style={{ width: '100%', textAlign: 'center' }}>
                  Manage Team Roster →
                </Link>
              </div>
            </article>
          )}

          {/* Module 7: MFA Settings (Director) */}
          {isDirector && (
            <article className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-control)', background: 'var(--surface-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-3-accent-personality)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 700 }}>
                  Director MFA Security
                </h3>
                <p className="card-meta" style={{ margin: 0, lineHeight: 1.5 }}>
                  Configure and verify your Time-based One-Time Password (TOTP) authenticator required for Director-level authorizations.
                </p>
              </div>
              <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--border-hairline)' }}>
                <Link href="/account/mfa" className="btn" style={{ width: '100%', textAlign: 'center' }}>
                  Configure Authenticator →
                </Link>
              </div>
            </article>
          )}

          {/* Module 8: Role Application (Participants only) */}
          {!isDirector && !membership && (
            <article className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-control)', background: 'var(--surface-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-3-accent-personality)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 700 }}>
                  Join the EDC AITR Team
                </h3>
                <p className="card-meta" style={{ margin: 0, lineHeight: 1.5 }}>
                  Apply to join the Entrepreneurship Development Cell Core Team for operational roles across logistics, media, and tech.
                </p>
              </div>
              <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--border-hairline)' }}>
                <Link href="/account/apply" className="btn btn-primary" style={{ width: '100%', textAlign: 'center' }}>
                  Submit Application →
                </Link>
              </div>
            </article>
          )}
        </div>
      </section>
    </div>
  );
}
