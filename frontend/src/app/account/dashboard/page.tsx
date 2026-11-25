import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../../lib/supabase/server';
import { getUserRole } from '../../../lib/auth/authorization';

type AppRole = 'participant' | 'core_team' | 'advisor' | 'director' | 'alumni';

const ROLE_LABELS: Record<AppRole, string> = {
  director: 'Director',
  advisor: 'Advisor',
  core_team: 'Core Team',
  alumni: 'Alumni',
  participant: 'Participant',
};

const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  director: 'Full organization-wide authority.',
  advisor: 'Organization-wide access. Approves Core Team applications.',
  core_team: 'Approved organization member. Can create events and receive assignments.',
  alumni: 'Verified former E-Cell member. Access to Alumni Connect.',
  participant: 'Standard participant account.',
};

export default async function DashboardPage() {
  const supabase = await createClient();
  if (!supabase) redirect('/account');

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect('/account');

  // Fetch profile and role in parallel
  const [profileResult, role, mfaResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    getUserRole(user.id),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);

  const profile = profileResult.data;
  const hasMfa = mfaResult.data?.currentLevel === 'aal2';
  const isMfaEnrolled = (mfaResult.data?.nextLevel === 'aal2') || hasMfa;
  const isDirector = role === 'director';
  const needsMfaSetup = isDirector && !isMfaEnrolled;

  // Fetch pending application count (for advisors/directors)
  let pendingCount = 0;
  if (role === 'advisor' || role === 'director') {
    const { count } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .is('reviewed_at', null);
    pendingCount = count ?? 0;
  }

  // Fetch own active membership
  const { data: membership } = await supabase
    .from('org_memberships')
    .select('role, status, effective_from')
    .eq('user_id', user.id)
    .eq('status', 'approved')
    .is('effective_until', null)
    .single();

  return (
    <>
      <h1>My Account</h1>

      {/* MFA Warning for Director */}
      {needsMfaSetup && (
        <section className="card" style={{ borderColor: 'var(--color-3-accent-personality)', marginBottom: 24 }}>
          <strong>Authenticator MFA required</strong>
          <p style={{ margin: '8px 0 12px' }}>
            Director-gated actions require an authenticator app (TOTP) to be enrolled and verified each session.
          </p>
          <Link href="/account/mfa">Set up authenticator app</Link>
        </section>
      )}

      {/* Role badge */}
      <section>
        <p>
          Signed in as <strong>{user.email}</strong>
        </p>
        <p>
          Role: <strong>{ROLE_LABELS[role as AppRole]}</strong>
          {isDirector && hasMfa && <span style={{ marginLeft: 8, color: 'var(--success)', fontSize: 13 }}>MFA verified</span>}
          {isDirector && !hasMfa && isMfaEnrolled && <span style={{ marginLeft: 8, color: 'var(--accent-ink)', fontSize: 13 }}>MFA enrolled, verify this session — <Link href="/account/mfa">verify</Link></span>}
        </p>
        <p style={{ color: '#555', fontSize: 14 }}>{ROLE_DESCRIPTIONS[role as AppRole]}</p>
        {membership && (
          <p style={{ fontSize: 13, color: '#666' }}>
            Member since {membership.effective_from ?? 'unknown'}
          </p>
        )}
      </section>

      {/* Admin pending badge */}
      {pendingCount > 0 && (
        <section style={{ background: '#e3f2fd', border: '1px solid #90caf9', borderRadius: 6, padding: '12px 20px', marginBottom: 16 }}>
          <strong>{pendingCount} pending application{pendingCount > 1 ? 's' : ''}</strong> awaiting your review.{' '}
          <Link href="/account/applications">Review →</Link>
        </section>
      )}

      {/* Navigation cards */}
      <section>
        <h2>Quick links</h2>
        <nav style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          <Link href="/account/profile">Edit profile</Link>
          {['core_team', 'advisor', 'director'].includes(role) && (
            <>
              <Link href="/workspace">My Event Work</Link>
              <Link href="/workspace/events">Event Management</Link>
            </>
          )}
          {!isDirector && !membership && (
            <Link href="/account/apply">Apply for a role</Link>
          )}
          {(role === 'advisor' || role === 'director') && (
            <>
              <Link href="/account/applications">Review applications</Link>
              <Link href="/account/team">Team &amp; tenure management</Link>
            </>
          )}
          {isDirector && (
            <Link href="/account/mfa">MFA settings</Link>
          )}
        </nav>
      </section>

      <section style={{ marginTop: 32 }}>
        <Link href="/account">← Account &amp; Sign out</Link>
      </section>
    </>
  );
}
