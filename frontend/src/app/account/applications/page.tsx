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

  // Fetch pending applications this reviewer can act on
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
    <>
      <h1>Review Applications</h1>
      <p style={{ color: '#555', marginBottom: 24 }}>
        {isDirector ? 'Director view — all pending applications.' : 'Advisor view — Core Team and Alumni applications.'}
      </p>
      <ApplicationsClient
        applications={normalized}
      />
      <p style={{ marginTop: 32 }}>
        <a href="/account/dashboard">← Back to dashboard</a>
      </p>
    </>
  );
}
