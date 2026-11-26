'use client';

import React, { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Building,
  CheckCircle2,
  ExternalLink,
  FileText,
  Globe,
  GraduationCap,
  Loader2,
  Plus,
  Rocket,
  Users,
} from 'lucide-react';
import { createClient } from '../../../lib/supabase/client';
import { CardGridSkeleton } from '../../../components/ui/Skeleton';

interface Startup {
  id: string;
  name: string;
  description: string;
  stage: string;
  team_summary: string | null;
  website_url: string | null;
  pitch_deck_url: string | null;
  status: string;
}

const STAGE_LABEL: Record<string, string> = {
  idea: 'Idea Stage',
  mvp: 'MVP',
  revenue: 'Early Revenue',
  scaling: 'Scaling',
};

const ALUMNI_NAV_ITEMS = [
  { label: 'Directory', href: '/alumni/directory' },
  { label: 'Startups', href: '/alumni/startups' },
  { label: 'Opportunities', href: '/alumni/opportunities' },
  { label: 'Messages', href: '/alumni/messages' },
];

export default function AlumniStartupsPage() {
  const [supabase] = useState(() => createClient());
  const [startups, setStartups] = useState<Startup[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [stage, setStage] = useState('mvp');
  const [teamSummary, setTeamSummary] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [pitchDeckUrl, setPitchDeckUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase
      .from('startups')
      .select('id, name, description, stage, team_summary, website_url, pitch_deck_url, status')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setStartups(data as Startup[]);
        setLoading(false);
      });
  }, [supabase]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setNote('');
    try {
      const res = await fetch('/api/alumni/startups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          stage,
          team_summary: teamSummary,
          website_url: websiteUrl,
          pitch_deck_url: pitchDeckUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to submit startup.');
      setStartups((prev) => [data.startup, ...prev]);
      setName('');
      setDescription('');
      setTeamSummary('');
      setWebsiteUrl('');
      setPitchDeckUrl('');
      setNote('Startup submitted for moderation review.');
      setShowForm(false);
    } catch (err) {
      setNote(err instanceof Error ? err.message : 'Error submitting startup.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1040px] px-4 py-8 sm:px-6 sm:py-12">
      {/* Top Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <Link
          href="/account/dashboard"
          className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-[#C01E30]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Dashboard</span>
        </Link>
        <span>/</span>
        <span className="font-semibold text-[var(--color-2-mood)]">Alumni Startups</span>
      </div>

      {/* Header Card */}
      <div className="mb-8 rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-6 sm:p-8">
        <div className="w-fit inline-flex items-center gap-2 rounded-full border border-[#C01E30]/20 bg-[#C01E30]/10 px-3 py-1 text-xs font-semibold text-[#C01E30] dark:text-[#E67C87]">
          <Rocket className="h-3.5 w-3.5" />
          <span>Founder Showcase</span>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-2-mood)] sm:text-3xl">
              Startup Showcase
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--text-secondary)]">
              Ventures founded or co-founded by EDC AITR alumni across health, deeptech, fintech, and consumer products.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowForm((f) => !f)}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#C01E30] px-5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#9E1625]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{showForm ? 'Close Form' : 'Showcase Your Startup'}</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-6 flex flex-wrap gap-2">
          {ALUMNI_NAV_ITEMS.map(({ label, href }) => {
            const isActive = href === '/alumni/startups';
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#C01E30] text-white shadow-xs'
                    : 'border border-[var(--border-hairline)] bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--color-2-mood)]'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      {note && (
        <div
          role="status"
          aria-live="polite"
          className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
        >
          {note}
        </div>
      )}

      {/* Submission Form Modal / Panel */}
      {showForm && (
        <div className="mb-8 rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-6 sm:p-8">
          <h2 className="text-base font-bold text-[var(--color-2-mood)] border-b border-[var(--border-hairline)] pb-3 mb-5">
            Submit Your Startup for Showcase
          </h2>

          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  Startup Name <span className="text-[#C01E30]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Acme AI"
                  className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] px-4 py-2.5 text-xs text-[var(--color-2-mood)] focus:border-[#C01E30] focus:bg-[var(--surface)] focus:ring-1 focus:ring-[#C01E30] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  Stage
                </label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] px-3 py-2.5 text-xs text-[var(--color-2-mood)] focus:border-[#C01E30] focus:bg-[var(--surface)] focus:ring-1 focus:ring-[#C01E30] focus:outline-none"
                >
                  <option value="idea">Idea Stage</option>
                  <option value="mvp">MVP</option>
                  <option value="revenue">Early Revenue</option>
                  <option value="scaling">Scaling</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                Description <span className="text-[#C01E30]">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What problem are you solving and who are your customers?…"
                className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] px-4 py-2.5 text-xs text-[var(--color-2-mood)] focus:border-[#C01E30] focus:bg-[var(--surface)] focus:ring-1 focus:ring-[#C01E30] focus:outline-none resize-y"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                Team Summary
              </label>
              <input
                type="text"
                value={teamSummary}
                onChange={(e) => setTeamSummary(e.target.value)}
                placeholder="e.g. 2 Co-founders (Tech + Biz), 3 engineers"
                className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] px-4 py-2.5 text-xs text-[var(--color-2-mood)] focus:border-[#C01E30] focus:bg-[var(--surface)] focus:ring-1 focus:ring-[#C01E30] focus:outline-none"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  Website URL
                </label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] px-4 py-2.5 text-xs text-[var(--color-2-mood)] focus:border-[#C01E30] focus:bg-[var(--surface)] focus:ring-1 focus:ring-[#C01E30] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  Pitch Deck Link
                </label>
                <input
                  type="url"
                  value={pitchDeckUrl}
                  onChange={(e) => setPitchDeckUrl(e.target.value)}
                  placeholder="Google Drive / DocSend link"
                  className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] px-4 py-2.5 text-xs text-[var(--color-2-mood)] focus:border-[#C01E30] focus:bg-[var(--surface)] focus:ring-1 focus:ring-[#C01E30] focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={busy}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#C01E30] px-6 text-xs font-semibold text-white transition-colors hover:bg-[#9E1625] disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}
                <span>Submit for Moderation</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Startups Grid */}
      <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between border-b border-[var(--border-hairline)] pb-4">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-[#C01E30]" />
            <h2 className="text-base font-bold text-[var(--color-2-mood)]">
              Active Alumni Ventures
            </h2>
          </div>
          <span className="font-mono text-xs text-[var(--text-muted)]">
            {startups.length} ventures
          </span>
        </div>

        {loading ? (
          <CardGridSkeleton count={4} />
        ) : startups.length === 0 ? (
          <div className="py-12 text-center">
            <Rocket className="mx-auto h-12 w-12 text-[var(--text-muted)] opacity-60" />
            <h3 className="mt-4 text-sm font-semibold text-[var(--color-2-mood)]">
              No startups showcased yet
            </h3>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Be the first founder to list your venture in the official EDC directory!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {startups.map((s) => (
              <article
                key={s.id}
                className="flex flex-col justify-between rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] p-5 transition-all hover:border-[var(--border-strong)]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full border border-[#C01E30]/20 bg-[#C01E30]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#C01E30] dark:text-[#E67C87]">
                      {STAGE_LABEL[s.stage] ?? s.stage}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] font-mono uppercase">
                      {s.status}
                    </span>
                  </div>

                  <h3 className="mt-3 text-base font-bold text-[var(--color-2-mood)]">
                    {s.name}
                  </h3>

                  <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)] line-clamp-3">
                    {s.description}
                  </p>

                  {s.team_summary && (
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                      <Users className="h-3 w-3" />
                      <span>{s.team_summary}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-4 border-t border-[var(--border-hairline)] pt-3 text-xs">
                  {s.website_url && (
                    <a
                      href={s.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-[#C01E30] hover:underline"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      <span>Website</span>
                    </a>
                  )}
                  {s.pitch_deck_url && (
                    <a
                      href={s.pitch_deck_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-[var(--text-muted)] hover:text-[#C01E30]"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>Deck</span>
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
