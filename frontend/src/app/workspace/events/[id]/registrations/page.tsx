import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '../../../../../lib/supabase/server';
import { getUserRole } from '../../../../../lib/auth/authorization';
import RegistrationsAdminClient from './RegistrationsAdminClient';

export const dynamic = 'force-dynamic';

export default async function EventRegistrationsAdminPage({
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

  const { data: allowed } = await supabase.rpc('is_rd_or_manager', {
    p_event_id: id,
    p_user_id: user.id,
  });
  if (!allowed) redirect('/workspace');

  const [{ data: event }, { data: regs }, { data: canManage }] = await Promise.all([
    supabase.from('events').select('id, title, is_paid').eq('id', id).maybeSingle(),
    supabase
      .from('registrations')
      .select(`
        id, status, payment_status, payment_ref, participant_category, organization, created_at,
        profiles!user_id(full_name, college),
        attendance_logs(checked_in_at)
      `)
      .eq('event_id', id)
      .order('created_at', { ascending: false }),
    supabase.rpc('can_manage_event', { p_event_id: id, p_user_id: user.id }),
  ]);

  if (!event) notFound();

  const normalized = (regs ?? []).map((r) => {
    const p = Array.isArray(r.profiles) ? (r.profiles[0] ?? null) : (r.profiles ?? null);
    const att = Array.isArray(r.attendance_logs) ? (r.attendance_logs[0] ?? null) : (r.attendance_logs ?? null);
    return {
      id: String(r.id),
      status: String(r.status),
      payment_status: String(r.payment_status),
      payment_ref: r.payment_ref ? String(r.payment_ref) : null,
      participant_category: String(r.participant_category),
      organization: r.organization ? String(r.organization) : (p?.college ? String(p.college) : null),
      full_name: p?.full_name ? String(p.full_name) : 'Participant',
      checked_in_at: att?.checked_in_at ? String(att.checked_in_at) : null,
    };
  });

  const confirmedCount = normalized.filter((r) => r.status === 'confirmed').length;
  const checkedInCount = normalized.filter((r) => Boolean(r.checked_in_at)).length;

  return (
    <>
      <p style={{ marginBottom: 16 }}>
        <Link href={`/workspace/events/${id}`}>← Event overview</Link> ·{' '}
        <Link href={`/workspace/events/${id}/checkin`}>QR Check-in Scanner</Link>
      </p>
      <h1>Registrations: {event.title}</h1>
      <div className="hero-ledger" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 28 }}>
        <div>
          <div className="ledger-label">Total records</div>
          <div className="ledger-value">{normalized.length}</div>
        </div>
        <div>
          <div className="ledger-label">Confirmed</div>
          <div className="ledger-value">{confirmedCount}</div>
        </div>
        <div>
          <div className="ledger-label">Checked in</div>
          <div className="ledger-value">{checkedInCount}</div>
        </div>
      </div>

      <RegistrationsAdminClient
        registrations={normalized}
        canVerifyPayments={Boolean(canManage)}
      />
    </>
  );
}
