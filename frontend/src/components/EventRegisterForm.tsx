'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Props {
  eventId: string;
  trackId: string | null;
  isPaid: boolean;
  feeAmount: number | null;
  upiId: string | null;
  upiQrUrl: string | null;
  existingRegistrationId: string | null;
  existingStatus: string | null;
}

export default function EventRegisterForm({
  eventId,
  trackId,
  isPaid,
  feeAmount,
  upiId,
  upiQrUrl,
  existingRegistrationId,
  existingStatus,
}: Props) {
  const router = useRouter();
  const [category, setCategory] = useState('student');
  const [organization, setOrganization] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (existingRegistrationId && existingStatus !== 'cancelled') {
    return (
      <div className="card" style={{ background: 'var(--surface-subtle)' }}>
        <strong>You are registered ({existingStatus?.replace('_', ' ')})</strong>
        <div>
          <Link href={`/portal/registrations/${existingRegistrationId}`} className="btn btn-primary">
            Open your ticket &amp; status
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          track_id: trackId,
          participant_category: category,
          organization,
          payment_ref: isPaid ? paymentRef : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Registration failed.');
      router.push(`/portal/registrations/${data.registration_id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ maxWidth: 480, background: 'var(--surface-subtle)' }}>
      <h3 style={{ margin: 0 }}>Register for this event</h3>
      <label>
        Participant Category
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="student">Student</option>
          <option value="founder">Founder</option>
          <option value="startup_rep">Startup Representative</option>
          <option value="other">Other</option>
        </select>
      </label>
      <label>
        College / Startup / Organization (optional)
        <input
          type="text"
          maxLength={160}
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
        />
      </label>

      {isPaid && (
        <div style={{ display: 'grid', gap: 10, padding: 12, background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border-hairline)' }}>
          <strong>Payment details: ₹{feeAmount}</strong>
          {upiId && (
            <span className="mono-meta">UPI ID: {upiId}</span>
          )}
          {upiQrUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={upiQrUrl} alt="UPI Payment QR" style={{ width: 160, height: 160, objectFit: 'contain', borderRadius: 6 }} />
          )}
          <label>
            UPI Transaction ID / Payment Reference *
            <input
              type="text"
              required
              minLength={4}
              maxLength={100}
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              placeholder="Enter UTR / reference number"
            />
          </label>
        </div>
      )}

      <button type="submit" disabled={busy}>
        {busy ? 'Submitting…' : isPaid ? 'Submit Registration & Payment Proof' : 'Confirm Registration'}
      </button>

      {error && (
        <p role="status" aria-live="polite" style={{ color: 'var(--danger)', margin: 0 }}>
          {error}
        </p>
      )}
    </form>
  );
}
