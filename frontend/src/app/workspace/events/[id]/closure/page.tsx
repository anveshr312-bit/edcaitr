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
      <p style={{ marginBottom: 16 }}>
        <Link href={`/workspace/events/${id}`}>← Event overview</Link> ·{' '}
        <Link href={`/events/${event.slug}`}>Public page</Link>
      </p>
      <h1>Highlights, Manuals, Exports &amp; Closure: {event.title}</h1>
      <ClosureExportsClient
        event={event}
        initialHighlights={highlights ?? []}
        initialManuals={manuals ?? []}
        initialCertCount={certCount ?? 0}
      />
    </>
  );
}
