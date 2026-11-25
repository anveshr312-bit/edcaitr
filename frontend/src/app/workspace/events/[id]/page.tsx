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
      {/* Dark header */}
      <div style={{ background: 'var(--color-2-mood)', color: 'var(--color-1-mood)', padding: '40px 36px', marginLeft: -24, marginRight: -24, marginTop: -24 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(251,249,245,0.4)', margin: '0 0 8px' }}>
          <Link href="/workspace/events" style={{ color: 'inherit', textDecoration: 'none' }}>Events</Link> / Manage
        </p>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.3rem,2.5vw,1.9rem)', fontWeight: 700, flex: 1 }}>{event.title}</h1>
          <span style={{ background: STATUS_COLOR[event.status] ?? 'rgba(251,249,245,0.2)', color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 4, flexShrink: 0 }}>
            {event.status}
          </span>
        </div>
        {/* Sub-nav tabs */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {[
            { label: 'Overview', href: `/workspace/events/${id}` },
            { label: 'Operational Teams', href: `/workspace/events/${id}/teams` },
            { label: 'Task Board', href: `/workspace/events/${id}/tasks` },
            { label: 'Registrations', href: `/workspace/events/${id}/registrations` },
            { label: 'QR Check-in', href: `/workspace/events/${id}/checkin` },
            { label: 'Highlights & Closure', href: `/workspace/events/${id}/closure` },
          ].map(({ label, href }) => (
            <Link key={href} href={href} style={{ padding: '6px 14px', borderRadius: 4, background: 'rgba(251,249,245,0.1)', color: 'rgba(251,249,245,0.8)', textDecoration: 'none', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>
              {label}
            </Link>
          ))}
          {event.status !== 'draft' && (
            <Link href={`/events/${event.slug}`} style={{ padding: '6px 14px', borderRadius: 4, background: 'var(--color-3-accent-personality)', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
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
          candidates={(candidates as { id: string; full_name: string; designation: string | null; role: string }[]) ?? []}
        />
      </div>
    </>
  );
}
