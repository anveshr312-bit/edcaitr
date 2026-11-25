'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { getImageKitUrl } from '../../../lib/media/imagekit';
import { CardGridSkeleton } from '../../../components/ui/Skeleton';
import { fetchWithTimeout } from '../../../lib/net/fetchWithDedupe';

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
      setMessageDrafts(d => ({ ...d, [recipientId]: '' }));
      setStatusNote('Contact request sent.');
      router.push('/alumni/messages');
    }
  }

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {/* Light header card */}
      <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-panel)', padding: 'clamp(24px, 3.5vw, 36px)', margin: 0 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 'var(--radius-control)', background: 'var(--accent-tint)', border: '1px solid rgba(224,72,38,0.2)', marginBottom: 10 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-3-accent-personality)' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-3-accent-personality)' }}>
            Alumni Connect
          </span>
        </div>
        <h1 style={{ margin: '0 0 6px', fontSize: 'clamp(1.5rem, 2.8vw, 2.2rem)', fontWeight: 700, lineHeight: 1.15, color: 'var(--text-primary)' }}>
          Member Directory
        </h1>
        <p style={{ margin: '0 0 20px', color: 'var(--text-secondary)', fontSize: 14 }}>
          Verified current and alumni EDC AITR members across batches.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[{ label: 'Directory', href: '/alumni/directory' }, { label: 'Startups', href: '/alumni/startups' }, { label: 'Opportunities', href: '/alumni/opportunities' }, { label: 'Messages', href: '/alumni/messages' }].map(({ label, href }) => (
            <a key={href} href={href} style={{ padding: '6px 14px', borderRadius: 'var(--radius-control)', background: href === '/alumni/directory' ? 'var(--color-3-accent-personality)' : 'var(--surface-subtle)', color: href === '/alumni/directory' ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border-hairline)', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>
              {label}
            </a>
          ))}
        </div>
      </div>

      {/* Search/filter */}
      <form onSubmit={handleSearch} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 10, alignItems: 'end' }}>
        <label style={{ display: 'grid', gap: 5 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Search</span>
          <input type="search" placeholder="Name, domain…" value={q} onChange={e => setQ(e.target.value)} />
        </label>
        <label style={{ display: 'grid', gap: 5 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Type</span>
          <select value={memberType} onChange={e => setMemberType(e.target.value)}>
            <option value="all">Current &amp; Alumni</option>
            <option value="current">Current Team</option>
            <option value="alumni">Alumni Only</option>
          </select>
        </label>
        <label style={{ display: 'grid', gap: 5 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>City</span>
          <input type="text" placeholder="e.g. Indore" value={city} onChange={e => setCity(e.target.value)} />
        </label>
        <label style={{ display: 'grid', gap: 5 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Industry</span>
          <input type="text" placeholder="e.g. FinTech" value={industry} onChange={e => setIndustry(e.target.value)} />
        </label>
        <button type="submit" className="btn btn-primary" style={{ marginTop: 20 }}>Filter</button>
      </form>

      {statusNote && (
        <p role="status" aria-live="polite" style={{ margin: 0, color: 'var(--accent-ink)', fontWeight: 500 }}>{statusNote}</p>
      )}

      {/* Results */}
      {loading ? (
        <CardGridSkeleton count={6} />
      ) : members.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p className="card-meta" style={{ margin: 0 }}>No verified members match your filters.</p>
        </div>
      ) : (
        <div className="grid">
          {members.map((m) => {
            const avatarUrl = getImageKitUrl(m.avatar_ref, 128);
            const isExpanded = expandedId === m.user_id;
            return (
              <article key={m.user_id} className="card">
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt={m.full_name} width={48} height={48} loading="lazy" decoding="async" className="avatar" />
                  ) : (
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-3-accent-personality)', flexShrink: 0 }}>
                      {(m.full_name || 'E').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 style={{ margin: '0 0 2px', fontSize: '1rem', fontWeight: 700 }}>{m.full_name}</h2>
                    <p className="card-meta" style={{ margin: '0 0 6px' }}>{m.designation || m.role.replace('_', ' ')}</p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {m.batch_year && <span className="mono-meta">{m.batch_year}</span>}
                      {m.city && <span className="mono-meta">{m.city}</span>}
                      {m.industry && <span className="badge" style={{ fontSize: 11 }}>{m.industry}</span>}
                    </div>
                  </div>
                </div>

                {m.bio && <p style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{m.bio}</p>}

                <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                  {m.linkedin_url && (
                    <a href={m.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: 'var(--color-3-accent-personality)', textDecoration: 'none', fontWeight: 500 }}>
                      LinkedIn →
                    </a>
                  )}
                  {m.allow_messages && (
                    <button
                      type="button"
                      style={{ fontSize: 13, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                      onClick={() => setExpandedId(isExpanded ? null : m.user_id)}
                    >
                      {isExpanded ? 'Cancel' : 'Send message'}
                    </button>
                  )}
                </div>

                {isExpanded && m.allow_messages && (
                  <div style={{ marginTop: 14, display: 'grid', gap: 8 }}>
                    <textarea
                      rows={3}
                      placeholder="Introduce yourself and explain why you'd like to connect…"
                      value={messageDrafts[m.user_id] ?? ''}
                      onChange={e => setMessageDrafts(d => ({ ...d, [m.user_id]: e.target.value }))}
                      style={{ font: 'inherit', padding: '8px 12px', resize: 'vertical', border: '1.5px solid var(--border-hairline)', borderRadius: 6 }}
                    />
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ fontSize: 13, padding: '8px 18px', width: 'fit-content' }}
                      disabled={!(messageDrafts[m.user_id]?.trim())}
                      onClick={() => void sendContactRequest(m.user_id)}
                    >
                      Send Contact Request
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination (max 20 per page) */}
      {total > 20 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingTop: 8 }}>
          <button
            type="button"
            className="btn"
            disabled={page <= 1 || loading}
            onClick={() => goToPage(page - 1)}
          >
            ← Previous
          </button>
          <span className="mono-meta">
            Page {page} of {Math.ceil(total / 20)} ({total} members)
          </span>
          <button
            type="button"
            className="btn"
            disabled={page * 20 >= total || loading}
            onClick={() => goToPage(page + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
