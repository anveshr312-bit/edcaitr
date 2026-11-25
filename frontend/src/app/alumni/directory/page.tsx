'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { getImageKitUrl } from '../../../lib/media/imagekit';

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
  const [messageDrafts, setMessageDrafts] = useState<Record<string, string>>({});
  const [statusNote, setStatusNote] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function fetchDirectory() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (memberType !== 'all') params.set('member_type', memberType);
    if (city) params.set('city', city);
    if (industry) params.set('industry', industry);
    const res = await fetch(`/api/alumni/directory?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setMembers(data.members ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { void fetchDirectory(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void fetchDirectory();
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
      {/* Header */}
      <div style={{ background: 'var(--color-2-mood)', color: 'var(--color-1-mood)', padding: '40px 36px', marginLeft: -24, marginRight: -24, marginTop: -24 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(251,249,245,0.4)', margin: '0 0 8px' }}>Alumni Connect</p>
        <h1 style={{ margin: '0 0 10px', fontSize: 'clamp(1.4rem,2.5vw,2rem)', fontWeight: 700 }}>Member Directory</h1>
        <p style={{ margin: '0 0 20px', color: 'rgba(251,249,245,0.65)', fontSize: 15 }}>Verified current and alumni EDC AITR members.</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ label: 'Directory', href: '/alumni/directory' }, { label: 'Startups', href: '/alumni/startups' }, { label: 'Opportunities', href: '/alumni/opportunities' }, { label: 'Messages', href: '/alumni/messages' }].map(({ label, href }) => (
            <a key={href} href={href} style={{ padding: '6px 14px', borderRadius: 4, background: href === '/alumni/directory' ? 'var(--color-3-accent-personality)' : 'rgba(251,249,245,0.1)', color: href === '/alumni/directory' ? '#fff' : 'rgba(251,249,245,0.8)', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '32px 0', color: 'var(--text-muted)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 11-6.219-8.56"/>
          </svg>
          Loading verified directory…
        </div>
      ) : members.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p className="card-meta" style={{ margin: 0 }}>No verified members match your filters.</p>
        </div>
      ) : (
        <div className="grid">
          {members.map((m) => {
            const avatarUrl = getImageKitUrl(m.avatar_ref);
            const isExpanded = expandedId === m.user_id;
            return (
              <article key={m.user_id} className="card">
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt={m.full_name} className="avatar" />
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
    </div>
  );
}
