import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '../../../../lib/supabase/server';
import { getUserRole } from '../../../../lib/auth/authorization';
import ManageEventClient from './ManageEventClient';

export const dynamic = 'force-dynamic';

export default async function ManageEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  if (!supabase) redirect('/account');

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect('/account');

  const role = await getUserRole(user.id);
  if (!['core_team', 'advisor', 'director'].includes(role)) {
    redirect('/account/dashboard');
  }

  const [{ data: event }, { data: spocs }, { data: guests }, { data: candidates }] = await Promise.all([
    supabase.from('events').select('*').eq('id', id).maybeSingle(),
    supabase
      .from('event_spocs')
      .select('user_id, is_primary, profiles!user_id(full_name, designation)')
      .eq('event_id', id),
    supabase.from('event_guests').select('*').eq('event_id', id).order('display_order'),
    supabase.rpc('get_approved_spoc_candidates'),
  ]);

  if (!event) notFound();

  // Enforce governance: Advisors and Directors are not student operators; exclude them from SPOC assignment
  const studentCandidates = ((candidates as { id: string; full_name: string; designation: string | null; role: string }[]) ?? []).filter(
    (c) => c.role !== 'director' && c.role !== 'advisor'
  );

  const normalizedSpocs = (spocs ?? []).map((s) => {
    const p = Array.isArray(s.profiles) ? (s.profiles[0] ?? null) : (s.profiles ?? null);
    return {
      user_id: String(s.user_id),
      is_primary: Boolean(s.is_primary),
      full_name: p?.full_name ? String(p.full_name) : 'Unnamed',
      designation: p?.designation ? String(p.designation) : null,
    };
  });

  const STATUS_COLOR: Record<string, string> = {
    draft: 'rgba(251,249,245,0.4)',
    published: 'rgba(21,128,61,0.9)',
    ongoing: 'var(--color-3-accent-personality)',
    closed: 'rgba(251,249,245,0.4)',
  };

  return (
    <>
      {/* Light header card */}
      <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-panel)', padding: 'clamp(24px, 3.5vw, 36px)', margin: 0 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 'var(--radius-control)', background: 'var(--accent-tint)', border: '1px solid rgba(192,30,48,0.2)', marginBottom: 10 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-3-accent-personality)' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-3-accent-personality)' }}>
            <Link href="/workspace/events" style={{ color: 'inherit', textDecoration: 'none' }}>Events</Link> / Manage
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.4rem, 2.6vw, 2rem)', fontWeight: 700, flex: 1, color: 'var(--text-primary)' }}>{event.title}</h1>
          <span style={{ background: STATUS_COLOR[event.status] ?? 'var(--surface-subtle)', color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'capitalize', padding: '4px 10px', borderRadius: 'var(--radius-control)', flexShrink: 0 }}>
            {event.status}
          </span>
        </div>
        {/* Sub-nav tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { label: 'Overview', href: `/workspace/events/${id}` },
            { label: 'Operational Teams', href: `/workspace/events/${id}/teams` },
            { label: 'Task Board', href: `/workspace/events/${id}/tasks` },
            { label: 'Registrations', href: `/workspace/events/${id}/registrations` },
            { label: 'QR Check-in', href: `/workspace/events/${id}/checkin` },
            { label: 'Highlights & Closure', href: `/workspace/events/${id}/closure` },
          ].map(({ label, href }) => (
            <Link key={href} href={href} style={{ padding: '6px 14px', borderRadius: 'var(--radius-control)', background: href === `/workspace/events/${id}` ? 'var(--color-3-accent-personality)' : 'var(--surface-subtle)', color: href === `/workspace/events/${id}` ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border-hairline)', textDecoration: 'none', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>
              {label}
            </Link>
          ))}
          {event.status !== 'draft' && (
            <Link href={`/events/${event.slug}`} style={{ padding: '6px 14px', borderRadius: 'var(--radius-control)', background: 'var(--surface)', color: 'var(--color-3-accent-personality)', border: '1px solid rgba(192,30,48,0.3)', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
              Public page →
            </Link>
          )}
        </div>
      </div>

      <div style={{ marginTop: 32 }}>
        <ManageEventClient
          event={event}
          initialSpocs={normalizedSpocs}
          initialGuests={guests ?? []}
          candidates={studentCandidates}
        />
      </div>
    </>
  );
}
