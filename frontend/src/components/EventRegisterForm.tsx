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
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center">
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          Registration Confirmed ({existingStatus?.replace('_', ' ')})
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Your seat is confirmed. Access your digital gate pass with QR code below.
        </p>
        <Link
          href={`/portal/registrations/${existingRegistrationId}`}
          className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-[#C01E30] hover:bg-[#a01828] text-white text-xs font-semibold shadow-sm transition-all"
        >
          Open Ticket &amp; QR Pass →
        </Link>
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
          organization: organization.trim() || undefined,
          payment_ref: isPaid ? paymentRef.trim() : undefined,
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
          Participant Category
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl border border-border/60 bg-background text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#C01E30]/40 transition-all cursor-pointer"
        >
          <option value="student">Student (Acropolis / External)</option>
          <option value="founder">Startup Founder / Entrepreneur</option>
          <option value="startup_rep">Startup Representative / Core Team</option>
          <option value="other">Professional / Academician</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
          Institution / Company / Startup <span className="text-muted-foreground/60 lowercase font-normal">(optional)</span>
        </label>
        <input
          type="text"
          maxLength={160}
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
          placeholder="e.g. Acropolis AITR / Venture Name"
          className="w-full px-3.5 py-2.5 rounded-xl border border-border/60 bg-background text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#C01E30]/40 transition-all"
        />
      </div>

      {isPaid && (
        <div className="rounded-xl border border-[#C01E30]/20 bg-[#C01E30]/5 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#C01E30]/10 pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground">Pass Fee</span>
            <span className="text-base font-bold text-[#C01E30]">₹{feeAmount}</span>
          </div>

          {upiId && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">UPI ID:</span>
              <span className="font-mono font-semibold text-foreground select-all bg-background px-2 py-0.5 rounded border border-border/40">{upiId}</span>
            </div>
          )}

          {upiQrUrl && (
            <div className="flex flex-col items-center justify-center p-2 bg-white rounded-lg shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={upiQrUrl} alt="UPI Payment QR" className="w-36 h-36 object-contain" />
              <span className="text-[10px] text-zinc-500 mt-1 font-mono">Scan via GPay, PhonePe, Paytm</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              UPI Transaction ID / UTR Reference <span className="text-[#C01E30]">*</span>
            </label>
            <input
              type="text"
              required
              minLength={4}
              maxLength={100}
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              placeholder="12-digit UTR or transaction ID"
              className="w-full px-3.5 py-2 rounded-lg border border-border/60 bg-background text-foreground text-xs font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#C01E30]/40 transition-all"
            />
          </div>
        </div>
      )}

      {error && (
        <div role="status" aria-live="polite" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-500 font-medium">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-[#C01E30] hover:bg-[#a81828] active:scale-[0.99] disabled:opacity-60 transition-all shadow-md shadow-[#C01E30]/20 flex items-center justify-center gap-2 cursor-pointer"
      >
        {busy ? (
          <>
            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Reserving Pass…
          </>
        ) : isPaid ? (
          'Submit Registration & Verify Payment'
        ) : (
          'Confirm Free Registration →'
        )}
      </button>
    </form>
  );
}
