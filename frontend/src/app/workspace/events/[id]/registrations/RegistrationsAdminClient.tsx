'use client';

import { useState } from 'react';

interface RegRow {
  id: string;
  status: string;
  payment_status: string;
  payment_ref: string | null;
  participant_category: string;
  organization: string | null;
  full_name: string;
  checked_in_at: string | null;
}

export default function RegistrationsAdminClient({
  registrations: initial,
  canVerifyPayments,
}: {
  registrations: RegRow[];
  canVerifyPayments: boolean;
}) {
  const [rows, setRows] = useState<RegRow[]>(initial);
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  async function verify(regId: string, decision: 'verified' | 'rejected') {
    setBusyId(regId);
    setMessage('');
    try {
      const res = await fetch(`/api/registrations/${regId}/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Verification failed.');

      setRows((prev) =>
        prev.map((r) =>
          r.id === regId
            ? {
                ...r,
                status: decision === 'verified' ? 'confirmed' : 'cancelled',
                payment_status: decision,
              }
            : r
        )
      );
      setMessage(
        decision === 'verified'
          ? `Payment verified and ticket ${data.ticket_code} issued.${data.email_sent ? ' Email sent.' : ''}`
          : 'Payment rejected.'
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setBusyId(null);
    }
  }

  const filtered = rows.filter(
    (r) =>
      query.trim() === '' ||
      r.full_name.toLowerCase().includes(query.toLowerCase()) ||
      (r.payment_ref ?? '').toLowerCase().includes(query.toLowerCase()) ||
      (r.organization ?? '').toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <input
        type="search"
        placeholder="Search participant, organization, or payment reference"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ maxWidth: 420 }}
      />

      {message && (
        <p role="status" aria-live="polite" style={{ color: 'var(--accent-ink)', margin: 0 }}>
          {message}
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="card">
          <p className="card-meta" style={{ margin: 0 }}>
            No registrations match this search.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {filtered.map((r) => (
            <article key={r.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <strong>{r.full_name}</strong>{' '}
                  <span className="card-meta">
                    ({r.participant_category}
                    {r.organization ? ` · ${r.organization}` : ''})
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="badge badge-accent">{r.status.replace('_', ' ')}</span>
                  <span className="mono-meta">
                    {r.checked_in_at
                      ? `Checked in ${new Date(r.checked_in_at).toLocaleTimeString('en-IN')}`
                      : 'Not checked in'}
                  </span>
                </div>
              </div>

              {r.payment_ref && (
                <p className="mono-meta" style={{ margin: 0 }}>
                  Payment Ref: {r.payment_ref} ({r.payment_status.replace('_', ' ')})
                </p>
              )}

              {canVerifyPayments && r.payment_status === 'pending_verification' && (
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={busyId === r.id}
                    onClick={() => void verify(r.id, 'verified')}
                  >
                    Verify Payment &amp; Issue Ticket
                  </button>
                  <button
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() => void verify(r.id, 'rejected')}
                  >
                    Reject
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
