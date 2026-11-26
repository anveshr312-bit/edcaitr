'use client';

import React, { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  GraduationCap,
  Loader2,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { createClient } from '../../../lib/supabase/client';

type AppType = 'core_team_application' | 'advisor_application' | 'alumni_verification';
type AppRole = 'participant' | 'core_team' | 'advisor' | 'director' | 'alumni';

interface RoleOption {
  type: AppType;
  title: string;
  badge: string;
  description: string;
  eligibility: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    type: 'core_team_application',
    title: 'Core Team Membership',
    badge: 'Operations & Execution',
    description:
      'Join one of the 12 active EDC operational teams (AV, Tech, Logistics, Stage, Clix, Creatives, and more) to organize summits, hackathons, and founder conclaves.',
    eligibility: 'Open to active Acropolis students · Reviewed by an Advisor',
    icon: Users,
  },
  {
    type: 'advisor_application',
    title: 'Faculty / Executive Advisor',
    badge: 'Governance & Strategy',
    description:
      'Guide institutional entrepreneurship policy, mentor student founders, approve cell recruitments, and oversee official conclave governance.',
    eligibility: 'Faculty & Industry Mentors · Reviewed by the Director',
    icon: ShieldCheck,
  },
  {
    type: 'alumni_verification',
    title: 'Alumni Connect Access',
    badge: 'Founder Network',
    description:
      'Verify your past EDC AITR tenure to join the exclusive Alumni Directory, list startup ventures, post internships, and mentor students.',
    eligibility: 'Verified EDC AITR Alumni · Reviewed by an Advisor',
    icon: GraduationCap,
  },
];

interface OwnApplication {
  id: string;
  application_type: AppType;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  statement?: string;
  created_at: string;
  reviewed_at?: string | null;
  review_note?: string | null;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  pending: {
    label: 'Under Review',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    icon: Clock,
  },
  approved: {
    label: 'Approved',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Declined',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
    icon: AlertCircle,
  },
  suspended: {
    label: 'Suspended',
    badgeClass: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20',
    icon: AlertCircle,
  },
};

export default function ApplyPage() {
  const [supabase] = useState(() => createClient());
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<AppRole>('participant');
  const [ownApplications, setOwnApplications] = useState<OwnApplication[]>([]);
  const [selected, setSelected] = useState<AppType | null>(null);
  const [statement, setStatement] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAppData = async () => {
    try {
      const res = await fetch('/api/applications');
      if (res.ok) {
        const data = await res.json();
        if (data.role) setCurrentRole(data.role as AppRole);
        if (data.applications) setOwnApplications(data.applications);
      }
    } catch (e) {
      console.warn('Failed to fetch via API route, falling back to direct query:', e);
    }
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getUser().then(async ({ data, error }) => {
      if (error || !data.user) {
        setLoading(false);
        return;
      }
      setUserId(data.user.id);
      setUserEmail(data.user.email ?? null);

      await fetchAppData();
      setLoading(false);
    });
  }, [supabase]);

  const hasPending = (type: AppType) =>
    ownApplications.some((a) => a.application_type === type && a.status === 'pending');

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected || statement.trim().length < 20) return;

    setBusy(true);
    setMessage('');
    setIsError(false);

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationType: selected,
          statement: statement.trim(),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Failed to submit application.');
      }

      setMessage(
        json.message ||
          'Application submitted successfully! Our leadership and governance board will review your submission.'
      );
      setIsError(false);
      setSelected(null);
      setStatement('');

      // Refresh applications list
      await fetchAppData();
    } catch (err: unknown) {
      setIsError(true);
      const errMessage =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err
            ? String((err as { message: unknown }).message)
            : 'Submission failed. Please check your network connection and try again.';
      setMessage(errMessage);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-[880px] items-center justify-center gap-3 px-4 py-24 text-sm text-[var(--text-muted)]">
        <Loader2 className="h-5 w-5 animate-spin text-[#C01E30]" />
        <span>Loading your application status…</span>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="mx-auto max-w-[480px] px-4 py-20 text-center">
        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-8 shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#C01E30]/10 text-[#C01E30]">
            <Users className="h-6 w-6" />
          </div>
          <h1 className="font-display text-xl font-bold text-[var(--color-2-mood)]">
            Sign In Required
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            You must be signed in to your EDC AITR account to submit role applications or request verification.
          </p>
          <div className="mt-6">
            <Link
              href="/account?next=/account/apply"
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#C01E30] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#9E1625]"
            >
              Sign In to Continue →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[880px] px-4 py-8 sm:px-6 sm:py-12">
      {/* Top Breadcrumb Navigation */}
      <div className="mb-6 flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <Link
          href="/account/dashboard"
          className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-[#C01E30]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Dashboard</span>
        </Link>
        <span>/</span>
        <span className="font-semibold text-[var(--color-2-mood)]">Apply for a Role</span>
      </div>

      {/* Hero Header Card */}
      <div className="mb-8 rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C01E30]/20 bg-[#C01E30]/10 px-3 py-1 text-xs font-semibold text-[#C01E30] dark:text-[#E67C87]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C01E30]" />
              <span>Role Application &amp; Governance</span>
            </div>

            <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-[var(--color-2-mood)] sm:text-3xl">
              Apply for an EDC Role
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--text-secondary)]">
              Submit your candidacy for official cell responsibility. All Core Team and Advisory applications are reviewed through structured governance workflows.
            </p>
          </div>

          <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] p-3 text-right">
            <p className="font-mono-data text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
              Current Role
            </p>
            <p className="mt-0.5 text-sm font-bold capitalize text-[var(--color-2-mood)]">
              {currentRole.replace(/_/g, ' ')}
            </p>
            {userEmail && (
              <p className="mt-0.5 max-w-[180px] truncate text-[11px] text-[var(--text-secondary)]">
                {userEmail}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Status Feedback Banner */}
      {message && (
        <div
          role="alert"
          aria-live="polite"
          className={`mb-8 flex items-start gap-3.5 rounded-xl border p-4 sm:p-5 ${
            isError
              ? 'border-red-500/25 bg-red-500/[0.08] text-red-700 dark:text-red-300'
              : 'border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-800 dark:text-emerald-200'
          }`}
        >
          {isError ? (
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          )}
          <div className="text-sm leading-relaxed">
            <p className="font-semibold">{isError ? 'Submission Issue' : 'Application Received'}</p>
            <p className="mt-0.5 opacity-90">{message}</p>
            {isError && message.toLowerCase().includes('profile') && (
              <div className="mt-3">
                <Link
                  href="/account/profile"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-red-700 transition-colors"
                >
                  Go to Edit Profile →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section 1: Previous & Active Applications (if any) */}
      {ownApplications.length > 0 && (
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-[var(--color-2-mood)]">
              Your Application History
            </h2>
            <span className="font-mono-data text-xs text-[var(--text-muted)]">
              {ownApplications.length} record{ownApplications.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-3">
            {ownApplications.map((app) => {
              const statusCfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusCfg.icon;
              const formattedDate = new Date(app.created_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });

              return (
                <div
                  key={app.id}
                  className="flex flex-col justify-between gap-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] p-4 sm:flex-row sm:items-center sm:p-5"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[var(--color-2-mood)]">
                        {app.application_type.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="font-mono-data text-xs text-[var(--text-muted)]">
                      Submitted on {formattedDate}
                    </p>
                    {app.review_note && (
                      <div className="mt-2 rounded-lg bg-[var(--surface-subtle)] px-3 py-1.5 text-xs text-[var(--text-secondary)]">
                        <strong className="text-[var(--color-2-mood)]">Reviewer note:</strong>{' '}
                        {app.review_note}
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${statusCfg.badgeClass}`}
                    >
                      <StatusIcon className="h-3.5 w-3.5" />
                      <span>{statusCfg.label}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Section 2: New Application Form */}
      <section className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="font-display text-lg font-bold text-[var(--color-2-mood)]">
            Submit a New Application
          </h2>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Select the role that matches your profile and provide a thorough supporting statement for leadership evaluation.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-6">
          {/* Role Cards Grid */}
          <div className="grid grid-cols-1 gap-3.5">
            {ROLE_OPTIONS.map((opt) => {
              const pending = hasPending(opt.type);
              const isSelected = selected === opt.type;
              const Icon = opt.icon;

              return (
                <div
                  key={opt.type}
                  onClick={() => {
                    if (!pending) setSelected(opt.type);
                  }}
                  className={`group relative flex cursor-pointer flex-col gap-3 rounded-xl border p-4 sm:p-5 transition-all duration-200 ${
                    pending
                      ? 'cursor-not-allowed border-[var(--border-hairline)] bg-[var(--surface-subtle)] opacity-60'
                      : isSelected
                        ? 'border-[#C01E30] bg-[#C01E30]/[0.03] shadow-sm'
                        : 'border-[var(--border-hairline)] bg-[var(--surface)] hover:border-[#C01E30]/50 hover:bg-[var(--surface-subtle)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                          isSelected
                            ? 'bg-[#C01E30] text-white'
                            : 'bg-[var(--surface-subtle)] text-[#C01E30] group-hover:bg-[#C01E30]/10'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-[var(--color-2-mood)]">
                            {opt.title}
                          </h3>
                          <span className="rounded-md bg-[var(--surface-subtle)] px-2 py-0.5 font-mono-data text-[10px] font-semibold text-[var(--text-secondary)]">
                            {opt.badge}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                          {opt.eligibility}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      {pending ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                          <Clock className="h-3 w-3" />
                          Pending
                        </span>
                      ) : (
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-full border transition-all ${
                            isSelected
                              ? 'border-[#C01E30] bg-[#C01E30] text-white'
                              : 'border-[var(--border-strong)] bg-transparent'
                          }`}
                        >
                          {isSelected && <span className="h-2 w-2 rounded-full bg-white" />}
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-xs leading-relaxed text-[var(--text-secondary)] sm:pl-13">
                    {opt.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Supporting Statement Area */}
          {selected && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="statement"
                  className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-2-mood)]"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#C01E30]" />
                  <span>Supporting Statement &amp; Motivation</span>
                </label>
                <span
                  className={`font-mono-data text-xs ${
                    statement.trim().length >= 20
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  {statement.trim().length} / 2000{' '}
                  <span className="text-[10px]">
                    {statement.trim().length >= 20 ? '(✓ Met minimum)' : '(Min. 20 chars)'}
                  </span>
                </span>
              </div>

              <textarea
                id="statement"
                required
                minLength={20}
                maxLength={2000}
                rows={5}
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                placeholder="Briefly explain your department, year, previous experience, and which operational team you would like to lead or contribute to..."
                className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] p-3.5 text-sm text-[var(--color-2-mood)] placeholder:text-[var(--text-muted)] transition-all focus:border-[#C01E30] focus:bg-[var(--surface)] focus:outline-none focus:ring-1 focus:ring-[#C01E30]"
              />
              <p className="text-[11px] text-[var(--text-muted)]">
                Statements are evaluated on initiative, domain alignment, and availability for conclaves.
              </p>
            </div>
          )}

          {/* Submit Action */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[var(--border-hairline)]">
            <Link
              href="/account/dashboard"
              className="text-xs font-semibold text-[var(--text-muted)] transition-colors hover:text-[var(--color-2-mood)]"
            >
              ← Back to Dashboard
            </Link>

            <button
              type="submit"
              disabled={!selected || busy || statement.trim().length < 20}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#C01E30] px-6 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#9E1625] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Submitting Application…</span>
                </>
              ) : (
                <>
                  <span>Submit Application</span>
                  <Send className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
