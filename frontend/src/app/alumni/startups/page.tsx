'use client';

import { useEffect, useState, type FormEvent } from 'react';
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
  idea: 'Idea Stage', mvp: 'MVP', revenue: 'Early Revenue', scaling: 'Scaling',
};

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
    setBusy(true); setNote('');
    try {
      const res = await fetch('/api/alumni/startups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, stage, team_summary: teamSummary, website_url: websiteUrl, pitch_deck_url: pitchDeckUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to submit startup.');
      setStartups(prev => [data.startup, ...prev]);
      setName(''); setDescription(''); setTeamSummary(''); setWebsiteUrl(''); setPitchDeckUrl('');
      setNote('Startup submitted for moderation review.');
      setShowForm(false);
    } catch (err) {
      setNote(err instanceof Error ? err.message : 'Error.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 32 }}>
      {/* Light header card */}
      <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-panel)', padding: 'clamp(24px, 3.5vw, 36px)', margin: 0 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 'var(--radius-control)', background: 'var(--accent-tint)', border: '1px solid rgba(192,30,48,0.2)', marginBottom: 10 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-3-accent-personality)' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-3-accent-personality)' }}>
            Alumni Connect
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: '0 0 6px', fontSize: 'clamp(1.5rem, 2.8vw, 2.2rem)', fontWeight: 700, lineHeight: 1.15, color: 'var(--text-primary)' }}>
              Startup Showcase
            </h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>
              Ventures founded or co-founded by EDC AITR alumni.
            </p>
          </div>
          <button className="btn btn-primary" style={{ fontSize: 13 }} onClick={() => setShowForm(f => !f)}>
            {showForm ? 'Cancel' : '+ Showcase Your Startup'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[{ label: 'Directory', href: '/alumni/directory' }, { label: 'Startups', href: '/alumni/startups' }, { label: 'Opportunities', href: '/alumni/opportunities' }, { label: 'Messages', href: '/alumni/messages' }].map(({ label, href }) => (
            <a key={href} href={href} style={{ padding: '6px 14px', borderRadius: 'var(--radius-control)', background: href === '/alumni/startups' ? 'var(--color-3-accent-personality)' : 'var(--surface-subtle)', color: href === '/alumni/startups' ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border-hairline)', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>
              {label}
            </a>
          ))}
        </div>
      </div>

      {note && <p role="status" aria-live="polite" style={{ margin: 0, color: 'var(--accent-ink)', fontWeight: 500 }}>{note}</p>}

      {/* Submit form */}
      {showForm && (
        <section className="card" style={{ maxWidth: 580, padding: '28px' }}>
          <h2 style={{ margin: '0 0 20px', fontSize: '1.1rem', fontWeight: 700 }}>Showcase Your Startup</h2>
          <form onSubmit={submit} style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 14 }}>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>Startup Name *</span>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>Stage</span>
                <select value={stage} onChange={e => setStage(e.target.value)}>
                  <option value="idea">Idea</option><option value="mvp">MVP</option>
                  <option value="revenue">Early Revenue</option><option value="scaling">Scaling</option>
                </select>
              </label>
            </div>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>Description *</span>
              <textarea rows={3} required value={description} onChange={e => setDescription(e.target.value)} style={{ font: 'inherit', padding: '8px 12px', resize: 'vertical', border: '1.5px solid var(--border-hairline)', borderRadius: 6 }} />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>Team Summary</span>
              <input type="text" value={teamSummary} onChange={e => setTeamSummary(e.target.value)} placeholder="e.g. 3 founders, 2 engineers" />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>Website URL</span>
                <input type="url" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://" />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>Pitch Deck Link</span>
                <input type="url" value={pitchDeckUrl} onChange={e => setPitchDeckUrl(e.target.value)} placeholder="Google Drive link" />
              </label>
            </div>
            <button type="submit" className="btn btn-primary" disabled={busy} style={{ width: 'fit-content' }}>
              {busy ? 'Submitting…' : 'Submit for Review'}
            </button>
          </form>
        </section>
      )}

      {/* Startups grid */}
      {loading ? (
        <CardGridSkeleton count={4} />
      ) : startups.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p className="card-meta" style={{ margin: 0 }}>No startups showcased yet. Be the first!</p>
        </div>
      ) : (
        <div className="grid">
          {startups.map((s) => (
            <article key={s.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span className="badge badge-accent">{STAGE_LABEL[s.stage] ?? s.stage}</span>
                <span className="mono-meta">{s.status}</span>
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{s.name}</h3>
              <p className="card-meta" style={{ margin: 0 }}>{s.description}</p>
              {s.team_summary && <p className="mono-meta" style={{ margin: 0 }}>Team: {s.team_summary}</p>}
              <div style={{ display: 'flex', gap: 12, marginTop: 'auto', paddingTop: 10, flexWrap: 'wrap' }}>
                {s.website_url && <a href={s.website_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: 'var(--color-3-accent-personality)', textDecoration: 'none', fontWeight: 600 }}>Website →</a>}
                {s.pitch_deck_url && <a href={s.pitch_deck_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>Pitch Deck →</a>}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
