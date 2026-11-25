import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '../../../../../lib/supabase/server';
import { getUserRole } from '../../../../../lib/auth/authorization';
import ClosureExportsClient from './ClosureExportsClient';

export const dynamic = 'force-dynamic';

export default async function EventClosurePage({
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

  const { data: canManage } = await supabase.rpc('can_manage_event', {
    p_event_id: id,
    p_user_id: user.id,
  });
  if (!canManage) redirect('/workspace');

  const [{ data: event }, { data: highlights }, { data: manuals }, { count: certCount }] =
    await Promise.all([
      supabase
        .from('events')
        .select('id, title, slug, status, drive_folder_url, final_report_url')
        .eq('id', id)
        .maybeSingle(),
      supabase.from('event_highlights').select('*').eq('event_id', id).order('display_order'),
      supabase.from('event_manuals').select('*').eq('event_id', id).order('created_at'),
      supabase.from('certificates').select('*', { count: 'exact', head: true }).eq('event_id', id),
    ]);

  if (!event) notFound();

  return (
    <>
      {/* Light header card */}
      <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-panel)', padding: 'clamp(24px, 3.5vw, 36px)', margin: 0 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 'var(--radius-control)', background: 'var(--accent-tint)', border: '1px solid rgba(224,72,38,0.2)', marginBottom: 10 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-3-accent-personality)' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-3-accent-personality)' }}>
            <Link href={`/workspace/events/${id}`} style={{ color: 'inherit', textDecoration: 'none' }}>{event.title}</Link> / Closure
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: '0 0 6px', fontSize: 'clamp(1.4rem, 2.6vw, 2rem)', fontWeight: 700, color: 'var(--text-primary)' }}>Highlights, Manuals &amp; Closure</h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>
              Upload event highlights, participant manuals, and manage exports and event lifecycle.
            </p>
          </div>
          {event.status !== 'draft' && (
            <Link href={`/events/${event.slug}`} style={{ padding: '8px 16px', background: 'var(--surface)', color: 'var(--color-3-accent-personality)', textDecoration: 'none', borderRadius: 'var(--radius-control)', fontSize: 13, border: '1px solid rgba(224,72,38,0.3)', fontWeight: 600 }}>
              Public page →
            </Link>
          )}
        </div>

        {/* Summary badges */}
        <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center', padding: '10px 18px', background: 'var(--surface-subtle)', borderRadius: 'var(--radius-control)', border: '1px solid var(--border-hairline)' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>{(highlights ?? []).length}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Highlights</div>
          </div>
          <div style={{ textAlign: 'center', padding: '10px 18px', background: 'var(--surface-subtle)', borderRadius: 'var(--radius-control)', border: '1px solid var(--border-hairline)' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>{(manuals ?? []).length}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Manuals</div>
          </div>
          <div style={{ textAlign: 'center', padding: '10px 18px', background: 'var(--surface-subtle)', borderRadius: 'var(--radius-control)', border: '1px solid var(--border-hairline)' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>{certCount ?? 0}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Certificates</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 32 }}>
        <ClosureExportsClient
          event={event}
          initialHighlights={highlights ?? []}
          initialManuals={manuals ?? []}
          initialCertCount={certCount ?? 0}
        />
      </div>
    </>
  );
}
