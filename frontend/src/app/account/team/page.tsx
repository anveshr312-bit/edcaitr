import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../../lib/supabase/server';
import { getUserRole } from '../../../lib/auth/authorization';
import TeamAdminClient from './TeamAdminClient';

export default async function TeamAdminPage() {
  const supabase = await createClient();
  if (!supabase) redirect('/account');

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect('/account');

  const role = await getUserRole(user.id);
  if (role !== 'advisor' && role !== 'director') redirect('/account/dashboard');

  const { data: memberships } = await supabase
    .from('org_memberships')
    .select(`
      id, user_id, role, status, effective_from,
      profiles!user_id (full_name, designation, college)
    `)
    .eq('status', 'approved')
    .is('effective_until', null)
    .order('role', { ascending: true });

  const normalized = (memberships ?? []).map((m) => {
    const profile = Array.isArray(m.profiles) ? (m.profiles[0] ?? null) : (m.profiles ?? null);
    return {
      id: String(m.id),
      user_id: String(m.user_id),
      role: String(m.role),
      effective_from: m.effective_from ? String(m.effective_from) : null,
      full_name: profile?.full_name ? String(profile.full_name) : 'Unnamed Member',
      designation: profile?.designation ? String(profile.designation) : null,
    };
  });

  const isDirector = role === 'director';

  return (
    <div style={{ display: 'grid', gap: 32 }}>
      {/* Light header card */}
      <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-panel)', padding: 'clamp(24px, 3.5vw, 36px)', margin: 0 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 'var(--radius-control)', background: 'var(--accent-tint)', border: '1px solid rgba(224,72,38,0.2)', marginBottom: 10 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-3-accent-personality)' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-3-accent-personality)' }}>
            {isDirector ? 'Director' : 'Advisor'} Governance
          </span>
        </div>
        <h1 style={{ margin: '0 0 8px', fontSize: 'clamp(1.5rem, 2.8vw, 2.2rem)', fontWeight: 700, lineHeight: 1.15, color: 'var(--text-primary)' }}>
          Team &amp; Tenure Management
        </h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14, maxWidth: 580, lineHeight: 1.6 }}>
          {isDirector
            ? 'Nominate promotions or record departures and suspensions with MFA verification.'
            : 'Nominate approved Core Team members for promotion to Advisor.'}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 16 }}>
        {(['director', 'advisor', 'core_team'] as const).map(r => {
          const count = normalized.filter(m => m.role === r).length;
          return (
            <div key={r} className="card" style={{ textAlign: 'center', padding: '18px 12px' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: count > 0 ? 'var(--color-3-accent-personality)' : 'var(--text-muted)' }}>{count}</div>
              <div className="card-meta" style={{ margin: 0, fontSize: 12 }}>{r.replace('_', ' ')}</div>
            </div>
          );
        })}
      </div>

      {/* Members table */}
      <section>
        <h2 style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.02em', color: 'var(--text-muted)', margin: '0 0 16px', borderLeft: '3px solid var(--color-3-accent-personality)', paddingLeft: 12 }}>
          Active Members ({normalized.length})
        </h2>
        <TeamAdminClient
          members={normalized}
          currentUserId={user.id}
          isDirector={isDirector}
        />
      </section>

      <p>
        <Link href="/account/dashboard" style={{ color: 'var(--text-muted)', fontSize: 14, textDecoration: 'none' }}>
          ← Back to dashboard
        </Link>
      </p>
    </div>
  );
}
