'use client';

import React, { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Calendar,
  CreditCard,
  Image as ImageIcon,
  Info,
  Loader2,
  MapPin,
  Plus,
  Search,
  Sparkles,
  Users,
} from 'lucide-react';
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
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Event Information */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border-hairline)] pb-2">
          Basic Details
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              Event Title <span className="text-[#C01E30]">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slug) {
                  setSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-|-$/g, '')
                  );
                }
              }}
              placeholder="e.g. Acropolis E-Summit 2026"
              className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] px-4 py-2.5 text-sm text-[var(--color-2-mood)] transition-all placeholder:text-[var(--text-muted)] focus:border-[#C01E30] focus:bg-[var(--surface)] focus:ring-1 focus:ring-[#C01E30] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              URL Slug <span className="text-[#C01E30]">*</span>
            </label>
            <input
              type="text"
              required
              pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              placeholder="e.g. e-summit-2026"
              className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] px-4 py-2.5 font-mono text-xs text-[var(--color-2-mood)] transition-all placeholder:text-[var(--text-muted)] focus:border-[#C01E30] focus:bg-[var(--surface)] focus:ring-1 focus:ring-[#C01E30] focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-[var(--text-muted)]">
              Public link: /events/{slug || 'your-event-slug'}
            </p>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              Short Summary
            </label>
            <input
              type="text"
              maxLength={240}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="One-sentence teaser shown on cards and previews"
              className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] px-4 py-2.5 text-sm text-[var(--color-2-mood)] transition-all placeholder:text-[var(--text-muted)] focus:border-[#C01E30] focus:bg-[var(--surface)] focus:ring-1 focus:ring-[#C01E30] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              Full Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed schedule, tracks, eligibility criteria, and guidelines…"
              className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] px-4 py-2.5 text-sm text-[var(--color-2-mood)] transition-all placeholder:text-[var(--text-muted)] focus:border-[#C01E30] focus:bg-[var(--surface)] focus:ring-1 focus:ring-[#C01E30] focus:outline-none resize-y"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              Venue / Location
            </label>
            <div className="relative">
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. Central Auditorium, AITR Campus, Indore"
                className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] px-4 py-2.5 text-sm text-[var(--color-2-mood)] transition-all placeholder:text-[var(--text-muted)] focus:border-[#C01E30] focus:bg-[var(--surface)] focus:ring-1 focus:ring-[#C01E30] focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Schedule & Capacity */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border-hairline)] pb-2">
          Schedule, Visibility &amp; Capacity
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              Starts At
            </label>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] px-4 py-2.5 text-sm text-[var(--color-2-mood)] transition-all focus:border-[#C01E30] focus:bg-[var(--surface)] focus:ring-1 focus:ring-[#C01E30] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              Ends At
            </label>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] px-4 py-2.5 text-sm text-[var(--color-2-mood)] transition-all focus:border-[#C01E30] focus:bg-[var(--surface)] focus:ring-1 focus:ring-[#C01E30] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              Publication Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
              className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] px-4 py-2.5 text-sm text-[var(--color-2-mood)] transition-all focus:border-[#C01E30] focus:bg-[var(--surface)] focus:ring-1 focus:ring-[#C01E30] focus:outline-none"
            >
              <option value="draft">Draft (Hidden from public listings)</option>
              <option value="published">Published (Live &amp; accepting registrations)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              Maximum Capacity
            </label>
            <input
              type="number"
              min={1}
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(e.target.value)}
              placeholder="Leave blank for unlimited capacity"
              className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] px-4 py-2.5 text-sm text-[var(--color-2-mood)] transition-all placeholder:text-[var(--text-muted)] focus:border-[#C01E30] focus:bg-[var(--surface)] focus:ring-1 focus:ring-[#C01E30] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Media Assets */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border-hairline)] pb-2">
          Visual Assets
        </h3>
        <ImageUploadField
          label="Event Banner / Poster"
          folder="events"
          value={posterRef}
          onChange={setPosterRef}
        />
      </div>

      {/* Ticket & Fee Configuration */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border-hairline)] pb-2">
          Ticketing &amp; Fees
        </h3>

        <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] p-4">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isPaid}
              onChange={(e) => setIsPaid(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--border-hairline)] accent-[#C01E30] focus:ring-[#C01E30]"
            />
            <span className="text-sm font-semibold text-[var(--color-2-mood)]">
              This is a paid event requiring ticket fees &amp; payment verification
            </span>
          </label>
        </div>

        {isPaid && (
          <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] p-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  Ticket Fee (₹) <span className="text-[#C01E30]">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  step="0.01"
                  value={feeAmount}
                  onChange={(e) => setFeeAmount(e.target.value)}
                  placeholder="e.g. 199.00"
                  className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--color-2-mood)] focus:border-[#C01E30] focus:ring-1 focus:ring-[#C01E30] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  UPI ID for Direct Transfers
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. ecell@icici"
                  className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--color-2-mood)] focus:border-[#C01E30] focus:ring-1 focus:ring-[#C01E30] focus:outline-none"
                />
              </div>
            </div>

            <ImageUploadField
              label="UPI Payment QR Code"
              folder="events"
              value={upiQrRef}
              onChange={setUpiQrRef}
            />
          </div>
        )}
      </div>

      {/* Event Leads / SPOCs */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border-hairline)] pb-2">
          Event Leads (SPOCs) <span className="text-[#C01E30]">*</span>
        </h3>

        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-[var(--text-muted)]" />
          <input
            type="search"
            placeholder="Search approved team members by name or role…"
            value={spocQuery}
            onChange={(e) => setSpocQuery(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] pl-10 pr-4 py-2.5 text-xs text-[var(--color-2-mood)] focus:border-[#C01E30] focus:bg-[var(--surface)] focus:ring-1 focus:ring-[#C01E30] focus:outline-none"
          />
        </div>

        <div className="max-h-56 overflow-y-auto rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] p-3 space-y-1.5">
          {filteredCandidates.map((c) => (
            <label
              key={c.id}
              className="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-[var(--surface)] cursor-pointer select-none"
            >
              <input
                type="checkbox"
                checked={selectedSpocs.includes(c.id)}
                onChange={() => toggleSpoc(c.id)}
                className="h-4 w-4 rounded border-[var(--border-hairline)] accent-[#C01E30] focus:ring-[#C01E30]"
              />
              <div className="text-xs">
                <span className="font-semibold text-[var(--color-2-mood)]">
                  {c.full_name || 'Unnamed Member'}
                </span>
                <span className="text-[var(--text-muted)] ml-2">
                  ({c.role.replace('_', ' ')}{c.designation ? ` · ${c.designation}` : ''})
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-medium text-rose-700 dark:text-rose-300"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#C01E30] px-8 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#9E1625] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Publishing Event…</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span>Create Event</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
