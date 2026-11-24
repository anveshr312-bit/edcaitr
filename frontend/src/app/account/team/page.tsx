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

  return (
    <>
      <h1>Team &amp; Tenure Management</h1>
      <p style={{ color: '#555', marginBottom: 24 }}>
        {role === 'director'
          ? 'Director view — nominate promotions or record departures/suspensions (MFA required for revocations).'
          : 'Advisor view — nominate approved Core Team members for promotion to Advisor.'}
      </p>
      <TeamAdminClient
        members={normalized}
        currentUserId={user.id}
        isDirector={role === 'director'}
      />
      <p style={{ marginTop: 32 }}>
        <Link href="/account/dashboard">← Back to dashboard</Link>
      </p>
    </>
  );
}
