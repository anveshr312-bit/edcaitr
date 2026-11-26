'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  Ban,
  Check,
  Flag,
  GraduationCap,
  MessageSquare,
  Send,
  User,
  X,
} from 'lucide-react';
import { createClient } from '../../../lib/supabase/client';
import { CardGridSkeleton } from '../../../components/ui/Skeleton';

interface Conversation {
  id: string;
  initiator_id: string;
  recipient_id: string;
  request_status: 'pending' | 'accepted' | 'declined';
  updated_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  pending: {
    label: 'Pending Request',
    badgeClass: 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  },
  accepted: {
    label: 'Connected',
    badgeClass: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  },
  declined: {
    label: 'Declined',
    badgeClass: 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300',
  },
};

const ALUMNI_NAV_ITEMS = [
  { label: 'Directory', href: '/alumni/directory' },
  { label: 'Startups', href: '/alumni/startups' },
  { label: 'Opportunities', href: '/alumni/opportunities' },
  { label: 'Messages', href: '/alumni/messages' },
];

export default function AlumniMessagesPage() {
  const [supabase] = useState(() => createClient());
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadInbox() {
    if (!supabase) return;
    const { data } = await supabase
      .from('alumni_conversations')
      .select('*')
      .order('updated_at', { ascending: false });
    if (data) setConversations(data as Conversation[]);
  }

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
        await loadInbox();
        const { data: msgs } = await supabase
          .from('alumni_messages')
          .select('id, conversation_id, sender_id, body, created_at')
          .order('created_at', { ascending: true });
        if (msgs) setMessages(msgs as Message[]);
      }
      setLoading(false);
    });
  }, [supabase]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAction(convId: string, action: 'accept' | 'decline' | 'block' | 'report') {
    setNote('');
    const res = await fetch('/api/alumni/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_id: convId, action }),
    });
    const data = await res.json();
    if (!res.ok) {
      setNote(data.error ?? 'Action failed.');
    } else {
      setNote(`Action "${action}" completed.`);
      await loadInbox();
    }
  }

  async function sendReply() {
    if (!selectedId || !reply.trim()) return;
    const text = reply.trim();
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      conversation_id: selectedId,
      sender_id: userId ?? '',
      body: text,
      created_at: new Date().toISOString(),
    };
    setNote('');
    setReply('');
    setMessages((prev) => [...prev, optimisticMsg]);

    const res = await fetch('/api/alumni/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_id: selectedId, body: text }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setReply(text);
      setNote(data.error ?? 'Could not send message.');
    } else {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? data.message : m)));
    }
  }

  const activeConv = conversations.find((c) => c.id === selectedId);
  const activeMsgs = messages.filter((m) => m.conversation_id === selectedId);

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
        <span className="font-semibold text-[var(--color-2-mood)]">Alumni Messages</span>
      </div>

      {/* Header Card */}
      <div className="mb-8 rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-6 sm:p-8">
        <div className="w-fit inline-flex items-center gap-2 rounded-full border border-[#C01E30]/20 bg-[#C01E30]/10 px-3 py-1 text-xs font-semibold text-[#C01E30] dark:text-[#E67C87]">
          <MessageSquare className="h-3.5 w-3.5" />
          <span>Direct Network Communications</span>
        </div>

        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-[var(--color-2-mood)] sm:text-3xl">
          Messages &amp; Inquiries
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--text-secondary)]">
          Peer-to-peer founder introductions, mentor consultations, and student inquiries.
        </p>

        {/* Navigation Tabs */}
        <div className="mt-6 flex flex-wrap gap-2">
          {ALUMNI_NAV_ITEMS.map(({ label, href }) => {
            const isActive = href === '/alumni/messages';
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

      {loading ? (
        <CardGridSkeleton count={3} />
      ) : conversations.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-12 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-[var(--text-muted)] opacity-60" />
          <h3 className="mt-4 text-sm font-semibold text-[var(--color-2-mood)]">
            No active conversations
          </h3>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            You have not initiated or received any contact requests yet. Browse the{' '}
            <Link href="/alumni/directory" className="text-[#C01E30] underline">
              Directory
            </Link>{' '}
            to connect with alumni.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Conversation list */}
          <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-5">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border-hairline)] pb-2">
              Conversations ({conversations.length})
            </h2>

            <div className="space-y-2">
              {conversations.map((c) => {
                const isSelected = selectedId === c.id;
                const statusCfg = STATUS_CONFIG[c.request_status] ?? STATUS_CONFIG.pending;

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full rounded-xl border p-3.5 text-left transition-all ${
                      isSelected
                        ? 'border-[#C01E30] bg-[#C01E30]/5 shadow-xs'
                        : 'border-[var(--border-hairline)] bg-[var(--surface-subtle)] hover:bg-[var(--surface)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-[var(--color-2-mood)]">
                        #{c.id.slice(0, 8)}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusCfg.badgeClass}`}
                      >
                        {statusCfg.label}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-[var(--text-muted)]">
                      Updated {new Date(c.updated_at).toLocaleDateString('en-IN')}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Thread view */}
          <div className="lg:col-span-2 rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-6 flex flex-col justify-between min-h-[440px]">
            {activeConv ? (
              <>
                <div>
                  {/* Thread Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-hairline)] pb-4 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[var(--color-2-mood)]">
                        Thread #{activeConv.id.slice(0, 8)}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${
                          STATUS_CONFIG[activeConv.request_status]?.badgeClass ?? ''
                        }`}
                      >
                        {STATUS_CONFIG[activeConv.request_status]?.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {activeConv.request_status === 'pending' && activeConv.recipient_id === userId && (
                        <>
                          <button
                            type="button"
                            onClick={() => void handleAction(activeConv.id, 'accept')}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white transition-all"
                          >
                            <Check className="h-3 w-3" />
                            <span>Accept</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleAction(activeConv.id, 'decline')}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-600 hover:text-white transition-all"
                          >
                            <X className="h-3 w-3" />
                            <span>Decline</span>
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => void handleAction(activeConv.id, 'block')}
                        className="rounded-lg border border-[var(--border-hairline)] bg-[var(--surface-subtle)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-rose-600 hover:border-rose-300 transition-colors"
                      >
                        Block
                      </button>
                    </div>
                  </div>

                  {/* Messages Stream */}
                  <div className="max-h-[340px] overflow-y-auto space-y-3 pr-1">
                    {activeMsgs.map((m) => {
                      const isOwn = m.sender_id === userId;
                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                              isOwn
                                ? 'bg-[#C01E30] text-white rounded-br-xs'
                                : 'bg-[var(--surface-subtle)] text-[var(--color-2-mood)] border border-[var(--border-hairline)] rounded-bl-xs'
                            }`}
                          >
                            {m.body}
                          </div>
                          <span className="mt-1 text-[10px] text-[var(--text-muted)]">
                            {isOwn ? 'You' : 'Member'} ·{' '}
                            {new Date(m.created_at).toLocaleTimeString('en-IN', {
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reply Bar */}
                {activeConv.request_status !== 'declined' ? (
                  <div className="mt-4 border-t border-[var(--border-hairline)] pt-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Write a reply…"
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            void sendReply();
                          }
                        }}
                        className="flex-1 rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] px-4 py-2.5 text-xs text-[var(--color-2-mood)] focus:border-[#C01E30] focus:bg-[var(--surface)] focus:ring-1 focus:ring-[#C01E30] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => void sendReply()}
                        disabled={!reply.trim()}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#C01E30] px-5 text-xs font-semibold text-white transition-colors hover:bg-[#9E1625] disabled:opacity-50"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Send</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 text-center text-xs text-[var(--text-muted)] border-t border-[var(--border-hairline)] pt-3">
                    This conversation was declined and is closed for replies.
                  </div>
                )}
              </>
            ) : (
              <div className="m-auto text-center py-12 text-sm text-[var(--text-muted)]">
                Select a conversation from the left to view the message history.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
