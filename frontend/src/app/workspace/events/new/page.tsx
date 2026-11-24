import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../../../lib/supabase/server';
import { getUserRole } from '../../../../lib/auth/authorization';
import NewEventClient from './NewEventClient';

export const dynamic = 'force-dynamic';

export default async function NewEventPage() {
  const supabase = await createClient();
  if (!supabase) redirect('/account');

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect('/account');

  const role = await getUserRole(user.id);
  if (!['core_team', 'advisor', 'director'].includes(role)) {
    redirect('/account/dashboard');
  }

  const { data: candidates } = await supabase.rpc('get_approved_spoc_candidates');

  return (
    <>
      <p style={{ marginBottom: 16 }}>
        <Link href="/workspace/events">← Back to Event Management</Link>
      </p>
      <h1>Create Event</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
        Configure event details, registration capacity, free/paid settings, and select one or more
        approved Event Leads (SPOCs).
      </p>
      <NewEventClient
        candidates={(candidates as { id: string; full_name: string; designation: string | null; role: string }[]) ?? []}
        currentUserId={user.id}
      />
    </>
  );
}
