'use client';

import React, { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  ExternalLink,
  GraduationCap,
  MapPin,
  MessageSquare,
  Search,
  Send,
  Users,
} from 'lucide-react';
import { getImageKitUrl } from '../../../lib/media/imagekit';
import { CardGridSkeleton } from '../../../components/ui/Skeleton';
import { fetchWithTimeout } from '../../../lib/net/fetchWithDedupe';
import MemberProfileModal, { type ModalMemberProfile } from '../../../components/ui/MemberProfileModal';

interface DirectoryMember {
  user_id: string;
  full_name: string;
  designation: string | null;
  bio: string | null;
  avatar_ref: string | null;
  role: string;
  batch_year: number | null;
  city: string | null;
  industry: string | null;
  domain: string | null;
  labels: string[];
  allow_messages: boolean;
  linkedin_url: string | null;
}

const ALUMNI_NAV_ITEMS = [
  { label: 'Directory', href: '/alumni/directory' },
  { label: 'Startups', href: '/alumni/startups' },
  { label: 'Opportunities', href: '/alumni/opportunities' },
  { label: 'Messages', href: '/alumni/messages' },
];

export default function AlumniDirectoryPage() {
  const router = useRouter();
  const [members, setMembers] = useState<DirectoryMember[]>([]);
  const [q, setQ] = useState('');
  const [memberType, setMemberType] = useState('all');
  const [city, setCity] = useState('');
  const [industry, setIndustry] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [messageDrafts, setMessageDrafts] = useState<Record<string, string>>({});
  const [statusNote, setStatusNote] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [modalMember, setModalMember] = useState<ModalMemberProfile | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchDirectory = useCallback(
    async (targetPage: number) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (memberType !== 'all') params.set('member_type', memberType);
      if (city) params.set('city', city);
      if (industry) params.set('industry', industry);
      params.set('page', String(targetPage));

      try {
        const res = await fetchWithTimeout(`/api/alumni/directory?${params.toString()}`, {
          signal: controller.signal,
          timeoutMs: 10_000,
        });
        if (res.ok) {
          const data = await res.json();
          setMembers(data.members ?? []);
          setTotal(data.total ?? 0);
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setStatusNote('Failed to load directory. Please retry.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [q, memberType, city, industry]
  );

  // 300ms debounce when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      void fetchDirectory(1);
    }, 300);
    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [fetchDirectory]);

  function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPage(1);
    void fetchDirectory(1);
  }

  function goToPage(nextPage: number) {
    setPage(nextPage);
    void fetchDirectory(nextPage);
  }

  async function sendContactRequest(recipientId: string) {
    const body = messageDrafts[recipientId]?.trim() ?? '';
    if (!body) return;
    setStatusNote('');
    const res = await fetch('/api/alumni/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient_id: recipientId, body }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatusNote(data.error ?? 'Could not send message.');
    } else {
      setMessageDrafts((d) => ({ ...d, [recipientId]: '' }));
      setStatusNote('Contact request sent.');
      router.push('/alumni/messages');
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
        <span className="font-semibold text-[var(--color-2-mood)]">Alumni Connect</span>
      </div>

      {/* Header Card */}
      <div className="mb-8 rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-6 sm:p-8">
        <div className="w-fit inline-flex items-center gap-2 rounded-full border border-[#C01E30]/20 bg-[#C01E30]/10 px-3 py-1 text-xs font-semibold text-[#C01E30] dark:text-[#E67C87]">
          <GraduationCap className="h-3.5 w-3.5" />
          <span>Alumni Connect Network</span>
        </div>

        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-[var(--color-2-mood)] sm:text-3xl">
          Member Directory
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--text-secondary)]">
          Discover verified current and alumni EDC AITR members across graduating batches, industries, and cities.
        </p>

        {/* Navigation Tabs */}
        <div className="mt-6 flex flex-wrap gap-2">
          {ALUMNI_NAV_ITEMS.map(({ label, href }) => {
            const isActive = href === '/alumni/directory';
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

      {/* Search and Filters */}
      <div className="mb-8 rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-6">
        <form onSubmit={handleSearch} className="grid gap-4 sm:grid-cols-4 items-end">
          <div className="sm:col-span-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--text-muted)]" />
              <input
                type="search"
                placeholder="Name, domain…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] pl-9 pr-3 py-2 text-xs text-[var(--color-2-mood)] transition-all placeholder:text-[var(--text-muted)] focus:border-[#C01E30] focus:bg-[var(--surface)] focus:ring-1 focus:ring-[#C01E30] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              Type
            </label>
            <select
              value={memberType}
              onChange={(e) => setMemberType(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] px-3 py-2 text-xs text-[var(--color-2-mood)] transition-all focus:border-[#C01E30] focus:bg-[var(--surface)] focus:ring-1 focus:ring-[#C01E30] focus:outline-none"
            >
              <option value="all">Current &amp; Alumni</option>
              <option value="current">Current Team</option>
              <option value="alumni">Alumni Only</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              City
            </label>
            <input
              type="text"
              placeholder="e.g. Indore"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] px-3 py-2 text-xs text-[var(--color-2-mood)] transition-all placeholder:text-[var(--text-muted)] focus:border-[#C01E30] focus:bg-[var(--surface)] focus:ring-1 focus:ring-[#C01E30] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              Industry
            </label>
            <input
              type="text"
              placeholder="e.g. FinTech"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] px-3 py-2 text-xs text-[var(--color-2-mood)] transition-all placeholder:text-[var(--text-muted)] focus:border-[#C01E30] focus:bg-[var(--surface)] focus:ring-1 focus:ring-[#C01E30] focus:outline-none"
            />
          </div>
        </form>
      </div>

      {statusNote && (
        <div
          role="status"
          aria-live="polite"
          className="mb-6 rounded-xl border border-[#C01E30]/20 bg-[#C01E30]/10 p-3 text-xs font-semibold text-[#C01E30]"
        >
          {statusNote}
        </div>
      )}

      {/* Directory Member Cards */}
      <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between border-b border-[var(--border-hairline)] pb-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#C01E30]" />
            <h2 className="text-base font-bold text-[var(--color-2-mood)]">
              Verified Members
            </h2>
          </div>
          <span className="text-xs text-[var(--text-muted)] font-mono">
            {total} found
          </span>
        </div>

        {loading ? (
          <CardGridSkeleton count={6} />
        ) : members.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-[var(--text-muted)] opacity-60" />
            <h3 className="mt-4 text-sm font-semibold text-[var(--color-2-mood)]">
              No verified members match your filters
            </h3>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Try broadening your search keywords or resetting filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {members.map((m) => {
              const avatarUrl = getImageKitUrl(m.avatar_ref, 128);
              const isExpanded = expandedId === m.user_id;

              return (
                <article
                  key={m.user_id}
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest('a') || target.closest('button') || target.closest('textarea')) return;
                    setModalMember({
                      id: m.user_id,
                      name: m.full_name,
                      role: 'alumni',
                      avatarUrl: m.avatar_ref,
                      bio: m.bio,
                      linkedinUrl: m.linkedin_url,
                      designation: m.designation,
                      company: m.industry || m.domain,
                      tier: 'alumni',
                    });
                  }}
                  className="flex flex-col justify-between rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] p-5 transition-all hover:border-[var(--border-strong)] cursor-pointer group"
                >
                  <div>
                    <div className="flex items-start gap-3.5">
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatarUrl}
                          alt={m.full_name}
                          width={48}
                          height={48}
                          loading="lazy"
                          decoding="async"
                          className="h-12 w-12 rounded-full border border-[var(--border-hairline)] object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--border-hairline)] bg-[var(--surface)] font-display text-base font-bold text-[#C01E30]">
                          {(m.full_name || 'E').charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-[var(--color-2-mood)] truncate group-hover:text-[#C01E30] transition-colors">
                          {m.full_name}
                        </h3>
                        <p className="text-xs text-[var(--text-secondary)] truncate">
                          {m.designation || 'Alumni'}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                          {m.batch_year && (
                            <span className="rounded-md border border-[var(--border-hairline)] bg-[var(--surface)] px-2 py-0.5 text-[var(--text-muted)]">
                              Class of {m.batch_year}
                            </span>
                          )}
                          {m.city && (
                            <span className="flex items-center gap-1 rounded-md border border-[var(--border-hairline)] bg-[var(--surface)] px-2 py-0.5 text-[var(--text-muted)]">
                              <MapPin className="h-2.5 w-2.5" />
                              <span>{m.city}</span>
                            </span>
                          )}
                          {m.industry && (
                            <span className="rounded-md border border-[#C01E30]/20 bg-[#C01E30]/10 px-2 py-0.5 font-semibold text-[#C01E30] dark:text-[#E67C87]">
                              {m.industry}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {m.bio && (
                      <p className="mt-3 text-xs leading-relaxed text-[var(--text-secondary)] line-clamp-3">
                        {m.bio}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 border-t border-[var(--border-hairline)] pt-3">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setModalMember({
                              id: m.user_id,
                              name: m.full_name,
                              role: 'alumni',
                              avatarUrl: m.avatar_ref,
                              bio: m.bio,
                              linkedinUrl: m.linkedin_url,
                              designation: m.designation,
                              company: m.industry || m.domain,
                              tier: 'alumni',
                            });
                          }}
                          className="inline-flex items-center gap-1 font-semibold text-xs text-[var(--text-muted)] hover:text-[#C01E30] transition-colors"
                        >
                          <span>View profile</span>
                        </button>

                        {m.linkedin_url && (
                          <a
                            href={m.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-[#C01E30] hover:underline"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span>LinkedIn</span>
                          </a>
                        )}
                      </div>

                      {m.allow_messages && (
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : m.user_id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--text-muted)] hover:text-[#C01E30] transition-colors"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>{isExpanded ? 'Close' : 'Send message'}</span>
                        </button>
                      )}
                    </div>

                    {isExpanded && m.allow_messages && (
                      <div className="mt-3 space-y-2 border-t border-[var(--border-hairline)] pt-3">
                        <textarea
                          rows={3}
                          placeholder="Introduce yourself and explain why you'd like to connect…"
                          value={messageDrafts[m.user_id] ?? ''}
                          onChange={(e) =>
                            setMessageDrafts((d) => ({ ...d, [m.user_id]: e.target.value }))
                          }
                          className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--surface)] p-2.5 text-xs text-[var(--color-2-mood)] placeholder:text-[var(--text-muted)] focus:border-[#C01E30] focus:outline-none resize-y"
                        />
                        <button
                          type="button"
                          disabled={!messageDrafts[m.user_id]?.trim()}
                          onClick={() => void sendContactRequest(m.user_id)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#C01E30] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#9E1625] disabled:opacity-50"
                        >
                          <Send className="h-3 w-3" />
                          <span>Send Request</span>
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="mt-8 flex items-center justify-between border-t border-[var(--border-hairline)] pt-4 text-xs">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => goToPage(page - 1)}
              className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] px-4 py-2 font-semibold text-[var(--color-2-mood)] hover:bg-[var(--surface)] disabled:opacity-50"
            >
              ← Previous
            </button>
            <span className="font-mono text-[var(--text-muted)]">
              Page {page} of {Math.ceil(total / 20)} ({total} members)
            </span>
            <button
              type="button"
              disabled={page * 20 >= total || loading}
              onClick={() => goToPage(page + 1)}
              className="rounded-xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)] px-4 py-2 font-semibold text-[var(--color-2-mood)] hover:bg-[var(--surface)] disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      <MemberProfileModal
        member={modalMember}
        onClose={() => setModalMember(null)}
      />
    </div>
  );
}
