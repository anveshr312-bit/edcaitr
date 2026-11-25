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
    <div style={{ maxWidth: 1040, margin: '0 auto', paddingBottom: 60 }}>
      {/* Executive User Header Banner */}
      <section
        className="card"
        style={{
          background: '#111318',
          color: '#FBF9F5',
          border: '1px solid #222631',
          padding: '28px 32px',
          marginBottom: 28,
          borderRadius: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
              <span className={roleMeta.badgeClass} style={{ fontSize: '0.75rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {roleMeta.label}
              </span>
              {isDirector && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: hasMfa ? 'rgba(34,197,94,0.15)' : 'rgba(224,72,38,0.2)',
                    color: hasMfa ? '#4ade80' : '#f87171',
                    border: `1px solid ${hasMfa ? 'rgba(34,197,94,0.3)' : 'rgba(224,72,38,0.4)'}`,
                  }}
                >
                  {hasMfa ? '✓ MFA Session Verified' : isMfaEnrolled ? '⚠ MFA Verification Required' : '⚠ MFA Setup Needed'}
                </span>
              )}
            </div>

            <h1 style={{ fontSize: '1.75rem', margin: '0 0 6px', color: '#FBF9F5', letterSpacing: '-0.02em' }}>
              Welcome back, {displayName}
            </h1>
            <p style={{ color: '#9CA3AF', margin: 0, fontSize: '0.875rem' }}>
              Signed in as <strong style={{ color: '#F3F4F6' }}>{user.email}</strong>
              {membership?.effective_from && ` · Member since ${membership.effective_from}`}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <Link
              href="/account/profile"
              className="btn"
              style={{
                background: 'rgba(255,255,255,0.08)',
                color: '#FBF9F5',
                border: '1px solid rgba(255,255,255,0.15)',
                fontSize: '0.85rem',
              }}
            >
              Edit Profile
            </Link>
            <form action="/auth/callback" method="GET" style={{ margin: 0 }}>
              {/* Signout trigger */}
              <Link
                href="/account"
                className="btn"
                style={{
                  background: 'transparent',
                  color: '#9CA3AF',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontSize: '0.85rem',
                }}
              >
                Sign Out
              </Link>
            </form>
          </div>
        </div>
      </section>

      {/* Director MFA Alert (if required) */}
      {needsMfaSetup && (
        <section
          className="card"
          style={{
            borderColor: '#E04826',
            background: '#FFF5F3',
            marginBottom: 24,
            padding: '20px 24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <strong style={{ color: '#991B1B', fontSize: '0.95rem' }}>
                Director Authenticator (TOTP) MFA Required
              </strong>
              <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#7F1D1D' }}>
                Director-gated administrative actions require multi-factor authentication to be enrolled and verified each session.
              </p>
            </div>
            <Link href="/account/mfa" className="btn btn-primary" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
              Configure MFA Now →
            </Link>
          </div>
        </section>
      )}

      {/* Pending Application Review Alert for Advisors / Directors */}
      {pendingCount > 0 && (
        <section
          className="card"
          style={{
            borderColor: '#3B82F6',
            background: '#EFF6FF',
            marginBottom: 24,
            padding: '18px 24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <strong style={{ color: '#1E40AF', fontSize: '0.95rem' }}>
                {pendingCount} Pending Recruitment Application{pendingCount > 1 ? 's' : ''}
              </strong>
              <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#1E3A8A' }}>
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
      <h2 style={{ fontSize: '1.25rem', marginBottom: 16, color: '#111318' }}>
        Organization Modules &amp; Services
      </h2>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
        {/* Module 1: Participant Portal & Passes */}
        <article className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>🎟️</div>
            <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem' }}>
              Participant Portal &amp; Passes
            </h3>
            <p className="card-meta" style={{ margin: 0, lineHeight: 1.45 }}>
              Access your registered events, download PVR-style admission QR tickets, view attendance check-ins, and claim event certificates.
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
              <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>🌐</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Alumni Connect</h3>
                <span className="badge badge-accent" style={{ fontSize: '0.7rem' }}>Private</span>
              </div>
              <p className="card-meta" style={{ margin: 0, lineHeight: 1.45 }}>
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
              <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>📋</div>
              <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem' }}>
                My Event Work (Workspace)
              </h3>
              <p className="card-meta" style={{ margin: 0, lineHeight: 1.45 }}>
                View your assigned operational tasks across the 12 confirmed teams (RD Check-in, AV, Logistics, Stage, Clix, and more).
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
              <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>⚡</div>
              <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem' }}>
                Event Management
              </h3>
              <p className="card-meta" style={{ margin: 0, lineHeight: 1.45 }}>
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
              <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>📝</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Recruitment Applications</h3>
                {pendingCount > 0 && (
                  <span className="badge badge-accent" style={{ fontSize: '0.7rem' }}>
                    {pendingCount} Pending
                  </span>
                )}
              </div>
              <p className="card-meta" style={{ margin: 0, lineHeight: 1.45 }}>
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
              <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>🛡️</div>
              <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem' }}>
                Team &amp; Tenure Management
              </h3>
              <p className="card-meta" style={{ margin: 0, lineHeight: 1.45 }}>
                Inspect the full organizational roster, manage executive tenures, grant promotions, and review public team visibility.
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
              <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>🔐</div>
              <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem' }}>
                Director MFA Security
              </h3>
              <p className="card-meta" style={{ margin: 0, lineHeight: 1.45 }}>
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
              <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>🚀</div>
              <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem' }}>
                Join the EDC AITR Team
              </h3>
              <p className="card-meta" style={{ margin: 0, lineHeight: 1.45 }}>
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
    </div>
  );
}
