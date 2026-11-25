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

  useEffect(() => {
    void fetchDirectory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      setMessageDrafts((d) => ({ ...d, [recipientId]: '' }));
      setStatusNote('Contact request sent.');
      router.push('/alumni/messages');
    }
  }

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <form
        onSubmit={handleSearch}
        className="card"
        style={{ maxWidth: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}
      >
        <input type="search" placeholder="Search name, domain..." value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={memberType} onChange={(e) => setMemberType(e.target.value)}>
          <option value="all">Current &amp; Alumni</option>
          <option value="current">Current Team Only</option>
          <option value="alumni">Alumni Only</option>
        </select>
        <input type="text" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
        <input type="text" placeholder="Industry" value={industry} onChange={(e) => setIndustry(e.target.value)} />
        <button type="submit">Filter</button>
      </form>

      {statusNote && (
        <p role="status" aria-live="polite" style={{ color: 'var(--accent-ink)', margin: 0 }}>
          {statusNote}
        </p>
      )}

      {loading ? (
        <p>Loading verified directory…</p>
      ) : members.length === 0 ? (
        <div className="card">
          <p className="card-meta" style={{ margin: 0 }}>
            No verified members match your filters.
          </p>
        </div>
      ) : (
        <div className="grid">
          {members.map((m) => {
            const avatarUrl = getImageKitUrl(m.avatar_ref);
            return (
              <article key={m.user_id} className="card">
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {avatarUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt={m.full_name} className="avatar" />
                  )}
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.08rem' }}>{m.full_name}</h2>
                    <p className="card-meta" style={{ margin: 0 }}>
                      {m.designation || m.role.replace('_', ' ')}
                      {m.batch_year ? ` · ${m.batch_year}` : ''}
                    </p>
                  </div>
                </div>

                {(m.city || m.industry) && (
                  <p className="mono-meta" style={{ margin: 0 }}>
                    {[m.city, m.industry, m.domain].filter(Boolean).join(' · ')}
                  </p>
                )}

                {m.labels.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {m.labels.map((l) => (
                      <span key={l} className="badge badge-accent">{l}</span>
                    ))}
                  </div>
                )}

                {m.bio && <p className="card-meta" style={{ margin: 0 }}>{m.bio}</p>}
                {m.linkedin_url && (
                  <a href={m.linkedin_url} target="_blank" rel="noopener noreferrer">
                    LinkedIn Profile
                  </a>
                )}

                {m.allow_messages && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8 }}>
                    <input
                      type="text"
                      placeholder="Intro message..."
                      value={messageDrafts[m.user_id] ?? ''}
                      onChange={(e) => setMessageDrafts((d) => ({ ...d, [m.user_id]: e.target.value }))}
                      style={{ flex: 1, minWidth: 0 }}
                    />
                    <button type="button" onClick={() => void sendContactRequest(m.user_id)}>
                      Message
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
