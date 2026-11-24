'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import ImageUploadField from '../../../../components/ImageUploadField';

interface Candidate {
  id: string;
  full_name: string;
  designation: string | null;
  role: string;
}

export default function NewEventClient({
  candidates,
  currentUserId,
}: {
  candidates: Candidate[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [isPaid, setIsPaid] = useState(false);
  const [feeAmount, setFeeAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [upiQrRef, setUpiQrRef] = useState('');
  const [posterRef, setPosterRef] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('');
  const [selectedSpocs, setSelectedSpocs] = useState<string[]>([currentUserId]);
  const [spocQuery, setSpocQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const filteredCandidates = candidates.filter((c) => {
    const q = spocQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      c.full_name.toLowerCase().includes(q) ||
      (c.designation ?? '').toLowerCase().includes(q) ||
      c.role.toLowerCase().includes(q)
    );
  });

  function toggleSpoc(id: string) {
    setSelectedSpocs((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((x) => x !== id) : prev) : [...prev, id]
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug: slug || undefined,
          summary,
          description,
          venue,
          starts_at: startsAt ? new Date(startsAt).toISOString() : null,
          ends_at: endsAt ? new Date(endsAt).toISOString() : null,
          status,
          is_paid: isPaid,
          fee_amount: isPaid ? Number(feeAmount) : null,
          upi_id: upiId,
          upi_qr_ref: upiQrRef,
          poster_ref: posterRef,
          max_capacity: maxCapacity ? Number(maxCapacity) : null,
          spoc_ids: selectedSpocs,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create event.');
      router.push(`/workspace/events/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create event.');
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 640 }}>
      <form onSubmit={handleSubmit} style={{ maxWidth: '100%' }}>
        <label>
          Event Title *
          <input
            type="text"
            required
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slug) {
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
              }
            }}
          />
        </label>

        <label>
          URL Slug *
          <input
            type="text"
            required
            pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
            placeholder="e.g. e-summit-2026"
          />
        </label>

        <label>
          Short Summary
          <input type="text" maxLength={240} value={summary} onChange={(e) => setSummary(e.target.value)} />
        </label>

        <label>
          Description
          <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>

        <label>
          Venue
          <input type="text" value={venue} onChange={(e) => setVenue(e.target.value)} />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label>
            Starts At
            <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          </label>
          <label>
            Ends At
            <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label>
            Initial Status
            <select value={status} onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </label>
          <label>
            Max Capacity (blank = unlimited)
            <input
              type="number"
              min={1}
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(e.target.value)}
            />
          </label>
        </div>

        <ImageUploadField label="Event Poster" folder="events" value={posterRef} onChange={setPosterRef} />

        <label style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <input
            type="checkbox"
            checked={isPaid}
            onChange={(e) => setIsPaid(e.target.checked)}
            style={{ width: 'auto' }}
          />
          Paid Event
        </label>

        {isPaid && (
          <div style={{ display: 'grid', gap: 12, padding: 14, background: 'var(--surface-muted)', borderRadius: 8 }}>
            <label>
              Ticket Fee (₹) *
              <input
                type="number"
                required
                min={1}
                step="0.01"
                value={feeAmount}
                onChange={(e) => setFeeAmount(e.target.value)}
              />
            </label>
            <label>
              UPI ID
              <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="ecell@upi" />
            </label>
            <ImageUploadField label="UPI Payment QR Image" folder="events" value={upiQrRef} onChange={setUpiQrRef} />
          </div>
        )}

        <div style={{ display: 'grid', gap: 8, padding: 14, border: '1px solid var(--border)', borderRadius: 8 }}>
          <strong>Event Leads (SPOCs) *</strong>
          <input
            type="search"
            placeholder="Search approved team members..."
            value={spocQuery}
            onChange={(e) => setSpocQuery(e.target.value)}
          />
          <div style={{ maxHeight: 180, overflowY: 'auto', display: 'grid', gap: 6 }}>
            {filteredCandidates.map((c) => (
              <label
                key={c.id}
                style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, fontWeight: 400 }}
              >
                <input
                  type="checkbox"
                  checked={selectedSpocs.includes(c.id)}
                  onChange={() => toggleSpoc(c.id)}
                  style={{ width: 'auto' }}
                />
                <span>
                  {c.full_name || 'Unnamed'} <span className="card-meta">({c.role.replace('_', ' ')}{c.designation ? ` · ${c.designation}` : ''})</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <button type="submit" disabled={busy}>
          {busy ? 'Creating…' : 'Create Event'}
        </button>

        {error && (
          <p role="status" aria-live="polite" style={{ color: 'var(--danger)', margin: 0 }}>
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
