'use client';

import React, { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Briefcase,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  GraduationCap,
  Loader2,
  MapPin,
  Plus,
  Send,
  Sparkles,
} from 'lucide-react';
import { createClient } from '../../../lib/supabase/client';
import { CardGridSkeleton } from '../../../components/ui/Skeleton';

interface Opportunity {
  id: string;
  startup_name: string | null;
  listing_type: string;
  title: string;
  description: string;
  skills: string | null;
  location: string | null;
  compensation: string | null;
  application_method: string;
  deadline: string | null;
  status: string;
}

const ALUMNI_NAV_ITEMS = [
  { label: 'Directory', href: '/alumni/directory' },
  { label: 'Startups', href: '/alumni/startups' },
  { label: 'Opportunities', href: '/alumni/opportunities' },
  { label: 'Messages', href: '/alumni/messages' },
];

const TYPE_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  internship: {
    label: 'Internship',
    badgeClass: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  },
  job: {
    label: 'Full-time Job',
    badgeClass: 'border-[#C01E30]/20 bg-[#C01E30]/10 text-[#C01E30] dark:text-[#E67C87]',
  },
  mentorship: {
    label: 'Mentorship',
    badgeClass: 'border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-300',
  },
  collab: {
    label: 'Project Collaboration',
    badgeClass: 'border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300',
  },
};

export default function AlumniOpportunitiesPage() {
  const [supabase] = useState(() => createClient());
  const [items, setItems] = useState<Opportunity[]>([]);
  const [title, setTitle] = useState('');
  const [listingType, setListingType] = useState('internship');
  const [startupName, setStartupName] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState('');
  const [location, setLocation] = useState('');
  const [compensation, setCompensation] = useState('');
  const [applicationMethod, setApplicationMethod] = useState('');
  const [deadline, setDeadline] = useState('');
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
      .from('opportunities')
      .select('id, startup_name, listing_type, title, description, skills, location, compensation, application_method, deadline, status')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setItems(data as Opportunity[]);
        setLoading(false);
      });
  }, [supabase]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setNote('');
    try {
      const res = await fetch('/api/alumni/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          listing_type: listingType,
          startup_name: startupName,
          description,
          skills,
          location,
          compensation,
          application_method: applicationMethod,
          deadline: deadline || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to post opportunity.');
      setItems((prev) => [data.opportunity, ...prev]);
      setTitle('');
      setStartupName('');
      setDescription('');
      setSkills('');
      setLocation('');
      setCompensation('');
      setApplicationMethod('');
      setDeadline('');
      setNote('Opportunity posted successfully.');
      setShowForm(false);
    } catch (err) {
      setNote(err instanceof Error ? err.message : 'Error posting opportunity.');
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
        <span className="font-semibold text-[var(--color-2-mood)]">Opportunities</span>
      </div>

      {/* Header Card */}
      <div className="mb-8 rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-6 sm:p-8">
        <div className="w-fit inline-flex items-center gap-2 rounded-full border border-[#C01E30]/20 bg-[#C01E30]/10 px-3 py-1 text-xs font-semibold text-[#C01E30] dark:text-[#E67C87]">
          <Briefcase className="h-3.5 w-3.5" />
          <span>Career &amp; Growth Hub</span>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-2-mood)] sm:text-3xl">
              Venture Opportunities
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--text-secondary)]">
              Internships, founding engineer roles, and mentorship openings across alumni startups and partner companies.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowForm((f) => !f)}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#C01E30] px-5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#9E1625]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{showForm ? 'Close Form' : 'Post an Opportunity'}</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-6 flex flex-wrap gap-2">
          {ALUMNI_NAV_ITEMS.map(({ label, href }) => {
            const isActive = href === '/alumni/opportunities';
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

      {/* Post Opportunity Form */}
      {showForm && (
        <div className="mb-8 rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-6 sm:p-8">
          <h2 className="text-base font-bold text-[var(--color-2-mood)] border-b border-[var(--border-hairline)] pb-3 mb-5">
            Post an Opportunity for EDC Members &amp; Alumni
          </h2>

          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  Role Title <span className="text-[#C01E30]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Founding Frontend Engineer"
                  className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] px-4 py-2.5 text-xs text-[var(--color-2-mood)] focus:border-[#C01E30] focus:bg-[var(--surface)] focus:ring-1 focus:ring-[#C01E30] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  Opportunity Type
                </label>
                <select
                  value={listingType}
                  onChange={(e) => setListingType(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] px-3 py-2.5 text-xs text-[var(--color-2-mood)] focus:border-[#C01E30] focus:bg-[var(--surface)] focus:ring-1 focus:ring-[#C01E30] focus:outline-none"
                >
                  <option value="internship">Internship</option>
                  <option value="job">Full-time Job</option>
                  <option value="mentorship">Mentorship</option>
                  <option value="collab">Collaboration</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                Startup / Venture Name
              </label>
              <input
                type="text"
                value={startupName}
                onChange={(e) => setStartupName(e.target.value)}
                placeholder="e.g. InnovateX Labs"
                className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] px-4 py-2.5 text-xs text-[var(--color-2-mood)] focus:border-[#C01E30] focus:bg-[var(--surface)] focus:ring-1 focus:ring-[#C01E30] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                Role Description <span className="text-[#C01E30]">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Outline core responsibilities, team size, and tech stack…"
                className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] px-4 py-2.5 text-xs text-[var(--color-2-mood)] focus:border-[#C01E30] focus:bg-[var(--surface)] focus:ring-1 focus:ring-[#C01E30] focus:outline-none resize-y"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  Required Skills
                </label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g. Next.js, Tailwind, Postgres, Go"
                  className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] px-4 py-2.5 text-xs text-[var(--color-2-mood)] focus:border-[#C01E30] focus:bg-[var(--surface)] focus:ring-1 focus:ring-[#C01E30] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Remote / Indore / Bengaluru"
                  className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] px-4 py-2.5 text-xs text-[var(--color-2-mood)] focus:border-[#C01E30] focus:bg-[var(--surface)] focus:ring-1 focus:ring-[#C01E30] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  Compensation / Stipend
                </label>
                <input
                  type="text"
                  value={compensation}
                  onChange={(e) => setCompensation(e.target.value)}
                  placeholder="e.g. ₹15,000/month or Equity"
                  className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] px-4 py-2.5 text-xs text-[var(--color-2-mood)] focus:border-[#C01E30] focus:bg-[var(--surface)] focus:ring-1 focus:ring-[#C01E30] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  Application Deadline
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] px-4 py-2.5 text-xs text-[var(--color-2-mood)] focus:border-[#C01E30] focus:bg-[var(--surface)] focus:ring-1 focus:ring-[#C01E30] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                How to Apply <span className="text-[#C01E30]">*</span>
              </label>
              <input
                type="text"
                required
                value={applicationMethod}
                onChange={(e) => setApplicationMethod(e.target.value)}
                placeholder="e.g. Email founder@startup.in with portfolio link or apply via link"
                className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] px-4 py-2.5 text-xs text-[var(--color-2-mood)] focus:border-[#C01E30] focus:bg-[var(--surface)] focus:ring-1 focus:ring-[#C01E30] focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={busy}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#C01E30] px-6 text-xs font-semibold text-white transition-colors hover:bg-[#9E1625] disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                <span>Publish Opportunity</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Opportunities List */}
      <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between border-b border-[var(--border-hairline)] pb-4">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-[#C01E30]" />
            <h2 className="text-base font-bold text-[var(--color-2-mood)]">
              Active Roles &amp; Openings
            </h2>
          </div>
          <span className="font-mono text-xs text-[var(--text-muted)]">
            {items.length} openings
          </span>
        </div>

        {loading ? (
          <CardGridSkeleton count={4} />
        ) : items.length === 0 ? (
          <div className="py-12 text-center">
            <Briefcase className="mx-auto h-12 w-12 text-[var(--text-muted)] opacity-60" />
            <h3 className="mt-4 text-sm font-semibold text-[var(--color-2-mood)]">
              No active openings posted yet
            </h3>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Check back soon or post a role for the student and alumni network!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {items.map((o) => {
              const config = TYPE_CONFIG[o.listing_type] ?? {
                label: o.listing_type,
                badgeClass: 'border-zinc-500/20 bg-zinc-500/10 text-zinc-600',
              };

              return (
                <article
                  key={o.id}
                  className="flex flex-col justify-between rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] p-5 transition-all hover:border-[var(--border-strong)]"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${config.badgeClass}`}
                      >
                        {config.label}
                      </span>
                      {o.startup_name && (
                        <span className="text-xs font-semibold text-[var(--color-2-mood)]">
                          {o.startup_name}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-3 text-base font-bold text-[var(--color-2-mood)]">
                      {o.title}
                    </h3>

                    <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)] line-clamp-3">
                      {o.description}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                      {o.location && (
                        <span className="flex items-center gap-1 rounded-md border border-[var(--border-hairline)] bg-[var(--surface)] px-2 py-0.5 text-[var(--text-muted)]">
                          <MapPin className="h-2.5 w-2.5" />
                          <span>{o.location}</span>
                        </span>
                      )}
                      {o.compensation && (
                        <span className="rounded-md border border-[var(--border-hairline)] bg-[var(--surface)] px-2 py-0.5 font-mono text-[var(--text-secondary)]">
                          {o.compensation}
                        </span>
                      )}
                      {o.deadline && (
                        <span className="flex items-center gap-1 rounded-md border border-[var(--border-hairline)] bg-[var(--surface)] px-2 py-0.5 text-[var(--text-muted)]">
                          <Clock className="h-2.5 w-2.5" />
                          <span>Deadline: {new Date(o.deadline).toLocaleDateString('en-IN')}</span>
                        </span>
                      )}
                    </div>

                    {o.skills && (
                      <div className="mt-3 text-[11px] text-[var(--text-secondary)]">
                        <span className="font-semibold text-[var(--text-muted)]">Skills:</span> {o.skills}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 border-t border-[var(--border-hairline)] pt-3 text-xs">
                    <div className="font-medium text-[var(--text-secondary)]">
                      <span className="text-[var(--text-muted)] font-semibold">How to apply:</span>{' '}
                      {o.application_method}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
