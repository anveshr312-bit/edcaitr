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
      {/* Header */}
      <div style={{ background: 'var(--color-2-mood)', color: 'var(--color-1-mood)', padding: '40px 36px', marginLeft: -24, marginRight: -24, marginTop: -24 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(251,249,245,0.4)', margin: '0 0 8px' }}>
          <Link href="/workspace/events" style={{ color: 'inherit', textDecoration: 'none' }}>Event Management</Link> / New
        </p>
        <h1 style={{ margin: '0 0 10px', fontSize: 'clamp(1.4rem,2.5vw,2rem)', fontWeight: 700 }}>Create Event</h1>
        <p style={{ margin: 0, color: 'rgba(251,249,245,0.65)', fontSize: 15, maxWidth: 560 }}>
          Configure event details, registration capacity, free/paid settings, and select one or more
          approved Event Leads (SPOCs).
        </p>
      </div>

      <div style={{ marginTop: 32, maxWidth: 680 }}>
        <NewEventClient
          candidates={(candidates as { id: string; full_name: string; designation: string | null; role: string }[]) ?? []}
          currentUserId={user.id}
        />
      </div>
    </>
  );
}
