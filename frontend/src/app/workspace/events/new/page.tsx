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
      {/* Light header card */}
      <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-panel)', padding: 'clamp(24px, 3.5vw, 36px)', margin: 0 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 'var(--radius-control)', background: 'var(--accent-tint)', border: '1px solid rgba(224,72,38,0.2)', marginBottom: 10 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-3-accent-personality)' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-3-accent-personality)' }}>
            <Link href="/workspace/events" style={{ color: 'inherit', textDecoration: 'none' }}>Events</Link> / New
          </span>
        </div>
        <h1 style={{ margin: '0 0 6px', fontSize: 'clamp(1.5rem, 2.8vw, 2.2rem)', fontWeight: 700, lineHeight: 1.15, color: 'var(--text-primary)' }}>
          Create Event
        </h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14, maxWidth: 560, lineHeight: 1.6 }}>
          Configure event details, registration capacity, fee settings, and select approved Event Leads (SPOCs).
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
