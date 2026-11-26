'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  GraduationCap,
  Loader2,
  ShieldCheck,
  User,
  Users,
  X,
} from 'lucide-react';

interface Application {
  id: string;
  application_type: string;
  status: string;
  statement: string | null;
  created_at: string;
  applicant_id: string;
  profiles: { full_name: string; college: string | null; designation: string | null } | null;
}

interface Props {
  applications: Application[];
}

const TYPE_CONFIG: Record<
  string,
  { label: string; badgeClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  core_team_application: {
    label: 'Core Team',
    badgeClass: 'border-[#C01E30]/20 bg-[#C01E30]/10 text-[#C01E30] dark:text-[#E67C87]',
    icon: Users,
  },
  advisor_application: {
    label: 'Advisor Application',
    badgeClass: 'border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-300',
    icon: ShieldCheck,
  },
  alumni_verification: {
    label: 'Alumni Verification',
    badgeClass: 'border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300',
    icon: GraduationCap,
  },
  promotion_nomination: {
    label: 'Promotion Nomination',
    badgeClass: 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    icon: ShieldCheck,
  },
};

export default function ApplicationsClient({ applications: initial }: Props) {
  const [apps, setApps] = useState<Application[]>(initial);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<Record<string, { text: string; isError?: boolean }>>({});

  async function decide(app: Application, decision: 'approved' | 'rejected') {
    const note = notes[app.id]?.trim() ?? '';
    if (!note) {
      setMessages((m) => ({
        ...m,
        [app.id]: { text: 'Please enter a review note before deciding.', isError: true },
      }));
      return;
    }
    const previousApps = apps;
    setApps((prev) => prev.filter((a) => a.id !== app.id));
    setBusy((b) => ({ ...b, [app.id]: true }));
    setMessages((m) => ({ ...m, [app.id]: { text: '' } }));

    try {
      const res = await fetch('/api/applications/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: app.id,
          applicationType: app.application_type,
          decision,
          note,
        }),
      });
      const rawText = await res.text();
      let payload: { ok?: boolean; error?: string } = {};
      try {
        payload = rawText ? JSON.parse(rawText) : {};
      } catch {
        payload = { error: rawText || `Server responded with HTTP ${res.status}` };
      }
      if (!res.ok) {
        throw new Error(payload.error ?? 'Action failed.');
      }
      setMessages((m) => ({
        ...m,
        [app.id]: {
          text: `Application ${decision === 'approved' ? 'approved' : 'rejected'} successfully.`,
        },
      }));
    } catch (err) {
      setApps(previousApps);
      setMessages((m) => ({
        ...m,
        [app.id]: {
          text: err instanceof Error ? err.message : 'Action failed.',
          isError: true,
        },
      }));
    } finally {
      setBusy((b) => ({ ...b, [app.id]: false }));
    }
  }

  if (apps.length === 0) {
    return (
      <div className="py-12 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500 opacity-80" />
        <h3 className="mt-3 text-sm font-semibold text-[var(--color-2-mood)]">
          Queue is completely clear!
        </h3>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          There are currently no candidate applications awaiting review.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {apps.map((app) => {
        const profile = app.profiles;
        const isBusy = busy[app.id] ?? false;
        const msg = messages[app.id];
        const typeConfig = TYPE_CONFIG[app.application_type] ?? {
          label: app.application_type.replace(/_/g, ' '),
          badgeClass: 'border-zinc-500/20 bg-zinc-500/10 text-zinc-600',
          icon: Users,
        };
        const TypeIcon = typeConfig.icon;

        return (
          <article
            key={app.id}
            className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] p-5 sm:p-6 transition-all hover:border-[var(--border-strong)]"
          >
            {/* Header info */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] text-[var(--text-secondary)]">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--color-2-mood)]">
                    {profile?.full_name || 'Candidate Member'}
                  </h3>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
                    {profile?.college && (
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        <span>{profile.college}</span>
                      </span>
                    )}
                    {profile?.designation && (
                      <span>· {profile.designation}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${typeConfig.badgeClass}`}
                >
                  <TypeIcon className="h-3.5 w-3.5" />
                  <span>{typeConfig.label}</span>
                </span>
                <span className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(app.created_at).toLocaleDateString('en-IN')}</span>
                </span>
              </div>
            </div>

            {/* Statement block */}
            {app.statement && (
              <div className="mt-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] p-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  Candidate Statement
                </div>
                <p className="text-xs leading-relaxed text-[var(--color-2-mood)] whitespace-pre-wrap">
                  {app.statement}
                </p>
              </div>
            )}

            {/* Review Note & Actions */}
            <div className="mt-5 border-t border-[var(--border-hairline)] pt-4">
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Governance Review Note <span className="text-[#C01E30]">*</span>
              </label>
              <textarea
                rows={2}
                maxLength={500}
                value={notes[app.id] ?? ''}
                onChange={(e) => setNotes((n) => ({ ...n, [app.id]: e.target.value }))}
                placeholder="State evaluation rationale or onboarding instructions (required for audit trail)…"
                disabled={isBusy}
                className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] px-3.5 py-2.5 text-xs text-[var(--color-2-mood)] transition-all placeholder:text-[var(--text-muted)] focus:border-[#C01E30] focus:ring-1 focus:ring-[#C01E30] focus:outline-none resize-y"
              />

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="text-[11px] text-[var(--text-muted)]">
                  Action triggers automated email notification &amp; role permission updates.
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void decide(app, 'rejected')}
                    disabled={isBusy}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-600 hover:text-white transition-all disabled:opacity-50"
                  >
                    {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                    <span>Reject</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => void decide(app, 'approved')}
                    disabled={isBusy}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-50"
                  >
                    {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    <span>Approve Candidate</span>
                  </button>
                </div>
              </div>
            </div>

            {msg?.text && (
              <div
                role="status"
                aria-live="polite"
                className={`mt-3 flex items-center gap-1.5 text-xs font-medium ${
                  msg.isError
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {msg.isError ? (
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                )}
                <span>{msg.text}</span>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
