'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { createClient } from '../../../lib/supabase/client';

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

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from('startups')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setStartups(data as Startup[]);
      });
  }, [supabase]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setNote('');
    try {
      const res = await fetch('/api/alumni/startups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          stage,
          team_summary: teamSummary,
          website_url: websiteUrl,
          pitch_deck_url: pitchDeckUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to submit startup.');
      setStartups((prev) => [data.startup, ...prev]);
      setName('');
      setDescription('');
      setTeamSummary('');
      setWebsiteUrl('');
      setPitchDeckUrl('');
      setNote('Startup submitted for moderation review.');
    } catch (err) {
      setNote(err instanceof Error ? err.message : 'Error.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 28 }}>
      <section className="card" style={{ maxWidth: 560 }}>
        <h2>Showcase Your Startup</h2>
        <form onSubmit={submit} style={{ maxWidth: '100%' }}>
          <label>
            Startup Name *
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Stage
            <select value={stage} onChange={(e) => setStage(e.target.value)}>
              <option value="idea">Idea</option>
              <option value="mvp">MVP</option>
              <option value="revenue">Early Revenue</option>
              <option value="scaling">Scaling</option>
            </select>
          </label>
          <label>
            Description *
            <textarea rows={3} required value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <label>
            Team Summary
            <input type="text" value={teamSummary} onChange={(e) => setTeamSummary(e.target.value)} />
          </label>
          <label>
            Website URL
            <input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} />
          </label>
          <label>
            Pitch Deck Link (respects your Drive sharing settings)
            <input type="url" value={pitchDeckUrl} onChange={(e) => setPitchDeckUrl(e.target.value)} />
          </label>
          <button type="submit" disabled={busy}>Submit Startup</button>
        </form>
        {note && <p role="status" aria-live="polite" style={{ color: 'var(--accent-ink)', margin: 0 }}>{note}</p>}
      </section>

      <section className="grid">
        {startups.map((s) => (
          <article key={s.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="badge badge-accent">{s.stage}</span>
              <span className="mono-meta">{s.status}</span>
            </div>
            <h3 style={{ margin: 0 }}>{s.name}</h3>
            <p className="card-meta" style={{ margin: 0 }}>{s.description}</p>
            {s.team_summary && <p className="mono-meta" style={{ margin: 0 }}>Team: {s.team_summary}</p>}
            <div style={{ display: 'flex', gap: 12, marginTop: 'auto', paddingTop: 8 }}>
              {s.website_url && <a href={s.website_url} target="_blank" rel="noopener noreferrer">Website</a>}
              {s.pitch_deck_url && <a href={s.pitch_deck_url} target="_blank" rel="noopener noreferrer">Pitch Deck</a>}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
