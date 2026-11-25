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
      {/* Header */}
      <div style={{ background: 'var(--color-2-mood)', color: 'var(--color-1-mood)', padding: '40px 36px', marginLeft: -24, marginRight: -24, marginTop: -24 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(251,249,245,0.4)', margin: '0 0 8px' }}>
          <Link href={`/workspace/events/${id}`} style={{ color: 'inherit', textDecoration: 'none' }}>{event.title}</Link> / Highlights &amp; Closure
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: '0 0 8px', fontSize: 'clamp(1.3rem,2.5vw,1.9rem)', fontWeight: 700 }}>Highlights, Manuals, Exports &amp; Closure</h1>
            <p style={{ margin: 0, color: 'rgba(251,249,245,0.65)', fontSize: 15 }}>
              Upload event highlights, participant manuals, and manage exports &amp; lifecycle.
            </p>
          </div>
          {event.status !== 'draft' && (
            <Link href={`/events/${event.slug}`} style={{ padding: '8px 16px', background: 'rgba(251,249,245,0.12)', color: 'var(--color-1-mood)', textDecoration: 'none', borderRadius: 6, fontSize: 13, border: '1px solid rgba(251,249,245,0.2)' }}>
              Public page →
            </Link>
          )}
        </div>

        {/* Summary badges */}
        <div style={{ display: 'flex', gap: 16, marginTop: 20, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{(highlights ?? []).length}</div>
            <div style={{ fontSize: 11, color: 'rgba(251,249,245,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Highlights</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{(manuals ?? []).length}</div>
            <div style={{ fontSize: 11, color: 'rgba(251,249,245,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Manuals</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{certCount ?? 0}</div>
            <div style={{ fontSize: 11, color: 'rgba(251,249,245,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Certificates</div>
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
