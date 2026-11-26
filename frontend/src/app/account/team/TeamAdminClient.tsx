'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  Award,
  CheckCircle2,
  Clock,
  Loader2,
  Shield,
  ShieldAlert,
  User,
  UserMinus,
  UserPlus,
} from 'lucide-react';

interface Member {
  id: string;
  user_id: string;
  role: string;
  effective_from: string | null;
  full_name: string;
  designation: string | null;
}

interface Props {
  members: Member[];
  currentUserId: string;
  isDirector: boolean;
}

export default function TeamAdminClient({ members: initial, currentUserId, isDirector }: Props) {
  const [members, setMembers] = useState<Member[]>(initial);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<Record<string, { text: string; isError?: boolean }>>({});

  async function nominate(member: Member) {
    const statement = notes[member.user_id]?.trim() ?? '';
    if (statement.length < 20) {
      setMessages((m) => ({
        ...m,
        [member.user_id]: { text: 'Enter a nomination statement (min 20 characters).', isError: true },
      }));
      return;
    }
    setBusy((b) => ({ ...b, [member.user_id]: true }));
    setMessages((m) => ({ ...m, [member.user_id]: { text: '' } }));
    try {
      const res = await fetch('/api/applications/nominate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomineeId: member.user_id, statement }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? 'Nomination failed.');
      setMessages((m) => ({
        ...m,
        [member.user_id]: { text: 'Promotion nomination submitted for Director review.' },
      }));
      setNotes((n) => ({ ...n, [member.user_id]: '' }));
    } catch (err) {
      setMessages((m) => ({
        ...m,
        [member.user_id]: { text: err instanceof Error ? err.message : 'Failed.', isError: true },
      }));
    } finally {
      setBusy((b) => ({ ...b, [member.user_id]: false }));
    }
  }

  async function revoke(member: Member, newStatus: 'departed' | 'suspended') {
    const reason = notes[member.user_id]?.trim() ?? '';
    if (!reason) {
      setMessages((m) => ({
        ...m,
        [member.user_id]: { text: 'Enter a reason before updating membership status.', isError: true },
      }));
      return;
    }
    setBusy((b) => ({ ...b, [member.user_id]: true }));
    setMessages((m) => ({ ...m, [member.user_id]: { text: '' } }));
    try {
      const res = await fetch('/api/memberships/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: member.user_id, newStatus, reason }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? 'Action failed.');
      setMembers((prev) => prev.filter((m) => m.user_id !== member.user_id));
    } catch (err) {
      setMessages((m) => ({
        ...m,
        [member.user_id]: { text: err instanceof Error ? err.message : 'Failed.', isError: true },
      }));
    } finally {
      setBusy((b) => ({ ...b, [member.user_id]: false }));
    }
  }

  if (members.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-[var(--text-muted)]">
        No active organization members found in roster.
      </div>
    );
  }

  const roleStyles: Record<string, string> = {
    director: 'border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-300',
    advisor: 'border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300',
    core_team: 'border-[#C01E30]/20 bg-[#C01E30]/10 text-[#C01E30] dark:text-[#E67C87]',
  };

  return (
    <div className="space-y-4">
      {members.map((member) => {
        const isSelf = member.user_id === currentUserId;
        const isBusy = busy[member.user_id] ?? false;
        const msg = messages[member.user_id];

        return (
          <article
            key={member.id}
            className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] p-5 transition-all hover:border-[var(--border-strong)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-hairline)] bg-[var(--surface)] text-[var(--text-secondary)]">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[var(--color-2-mood)]">
                      {member.full_name}
                    </span>
                    {isSelf && (
                      <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        You
                      </span>
                    )}
                  </div>
                  {member.designation && (
                    <div className="text-xs text-[var(--text-secondary)]">
                      {member.designation}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                    roleStyles[member.role] ?? 'border-zinc-500/20 bg-zinc-500/10 text-zinc-600'
                  }`}
                >
                  <Shield className="h-3 w-3" />
                  <span>{member.role.replace('_', ' ')}</span>
                </span>
                {member.effective_from && (
                  <span className="text-[11px] text-[var(--text-muted)]">
                    Since {new Date(member.effective_from).toLocaleDateString('en-IN')}
                  </span>
                )}
              </div>
            </div>

            {!isSelf && (member.role === 'core_team' || isDirector) && (
              <div className="mt-4 border-t border-[var(--border-hairline)] pt-4">
                <div className="mb-2">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Nomination Statement / Governance Reason
                  </label>
                  <input
                    type="text"
                    maxLength={500}
                    value={notes[member.user_id] ?? ''}
                    onChange={(e) =>
                      setNotes((n) => ({ ...n, [member.user_id]: e.target.value }))
                    }
                    placeholder="Required for nomination (20+ chars) or departure/suspension"
                    disabled={isBusy}
                    className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] px-3.5 py-2 text-xs text-[var(--color-2-mood)] transition-all placeholder:text-[var(--text-muted)] focus:border-[#C01E30] focus:ring-1 focus:ring-[#C01E30] focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {member.role === 'core_team' && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void nominate(member)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#C01E30]/30 bg-[#C01E30]/10 px-3 py-1.5 text-xs font-semibold text-[#C01E30] hover:bg-[#C01E30] hover:text-white transition-all disabled:opacity-50"
                    >
                      {isBusy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <UserPlus className="h-3.5 w-3.5" />
                      )}
                      <span>Nominate for Advisor</span>
                    </button>
                  )}

                  {isDirector && (
                    <>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void revoke(member, 'departed')}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--color-2-mood)] transition-all disabled:opacity-50"
                      >
                        <UserMinus className="h-3.5 w-3.5" />
                        <span>Record Departure</span>
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void revoke(member, 'suspended')}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-600 hover:text-white transition-all disabled:opacity-50"
                      >
                        <ShieldAlert className="h-3.5 w-3.5" />
                        <span>Suspend</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

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
