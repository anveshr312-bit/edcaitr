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
  const pendingPayment = normalized.filter(r => r.payment_status === 'pending_verification').length;

  return (
    <>
      {/* Light header card */}
      <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-panel)', padding: 'clamp(24px, 3.5vw, 36px)', margin: 0 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 'var(--radius-control)', background: 'var(--accent-tint)', border: '1px solid rgba(224,72,38,0.2)', marginBottom: 10 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-3-accent-personality)' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-3-accent-personality)' }}>
            <Link href={`/workspace/events/${id}`} style={{ color: 'inherit', textDecoration: 'none' }}>{event.title}</Link> / Registrations
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: '0 0 6px', fontSize: 'clamp(1.4rem, 2.6vw, 2rem)', fontWeight: 700, color: 'var(--text-primary)' }}>Registrations</h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>
              Attendee ticket passes, payment verification, and manual check-in status.
            </p>
          </div>
          <Link href={`/workspace/events/${id}/checkin`} className="btn btn-primary" style={{ fontSize: 13, fontWeight: 600 }}>
            QR Check-in →
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 16, marginTop: 24 }}>
        <div className="card" style={{ textAlign: 'center', padding: '18px 12px' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{normalized.length}</div>
          <div className="card-meta" style={{ margin: 0, fontSize: 11 }}>Total</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '18px 12px' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--success)' }}>{confirmedCount}</div>
          <div className="card-meta" style={{ margin: 0, fontSize: 11 }}>Confirmed</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '18px 12px' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{checkedInCount}</div>
          <div className="card-meta" style={{ margin: 0, fontSize: 11 }}>Checked In</div>
        </div>
        {event.is_paid && (
          <div className="card" style={{ textAlign: 'center', padding: '18px 12px', borderLeft: pendingPayment > 0 ? '3px solid var(--accent-ink)' : undefined }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: pendingPayment > 0 ? 'var(--accent-ink)' : 'var(--text-muted)' }}>{pendingPayment}</div>
            <div className="card-meta" style={{ margin: 0, fontSize: 11 }}>Pending Payment</div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 32 }}>
        <RegistrationsAdminClient
          registrations={normalized}
          canVerifyPayments={Boolean(canManage)}
        />
      </div>
    </>
  );
}
