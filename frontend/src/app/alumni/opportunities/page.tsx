'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { createClient } from '../../../lib/supabase/client';

interface Opportunity {
  id: string;
  startup_name: string | null;
  listing_type: string;
  title: string;
  description: string;
  skills: string | null;
  location: string | null;
  compensation: string | null;
  application_method: string;
  deadline: string | null;
  status: string;
}

export default function AlumniOpportunitiesPage() {
  const [supabase] = useState(() => createClient());
  const [items, setItems] = useState<Opportunity[]>([]);
  const [title, setTitle] = useState('');
  const [listingType, setListingType] = useState('internship');
  const [startupName, setStartupName] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState('');
  const [location, setLocation] = useState('');
  const [compensation, setCompensation] = useState('');
  const [applicationMethod, setApplicationMethod] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from('opportunities')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setItems(data as Opportunity[]);
      });
  }, [supabase]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setNote('');
    try {
      const res = await fetch('/api/alumni/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          listing_type: listingType,
          startup_name: startupName,
          description,
          skills,
          location,
          compensation,
          application_method: applicationMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to post opportunity.');
      setItems((prev) => [data.opportunity, ...prev]);
      setTitle('');
      setStartupName('');
      setDescription('');
      setSkills('');
      setLocation('');
      setCompensation('');
      setApplicationMethod('');
      setNote('Opportunity posted.');
    } catch (err) {
      setNote(err instanceof Error ? err.message : 'Error.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 28 }}>
      <section className="card" style={{ maxWidth: 560 }}>
        <h2>Post an Opportunity</h2>
        <form onSubmit={submit} style={{ maxWidth: '100%' }}>
          <label>
            Title *
            <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Founding Frontend Engineer" />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>
              Type
              <select value={listingType} onChange={(e) => setListingType(e.target.value)}>
                <option value="internship">Internship</option>
                <option value="full_time">Full-time Role</option>
                <option value="cofounder">Co-Founder</option>
              </select>
            </label>
            <label>
              Startup / Organization
              <input type="text" value={startupName} onChange={(e) => setStartupName(e.target.value)} />
            </label>
          </div>
          <label>
            Description *
            <textarea rows={3} required value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <label>
            Skills
            <input type="text" value={skills} onChange={(e) => setSkills(e.target.value)} />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>
              Location / Remote
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} />
            </label>
            <label>
              Compensation / Equity
              <input type="text" value={compensation} onChange={(e) => setCompensation(e.target.value)} />
            </label>
          </div>
          <label>
            How to Apply *
            <input type="text" required value={applicationMethod} onChange={(e) => setApplicationMethod(e.target.value)} placeholder="Email or application link" />
          </label>
          <button type="submit" disabled={busy}>Post Opportunity</button>
        </form>
        {note && <p role="status" aria-live="polite" style={{ color: 'var(--accent-ink)', margin: 0 }}>{note}</p>}
      </section>

      <section className="grid">
        {items.map((o) => (
          <article key={o.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="badge badge-accent">{o.listing_type.replace('_', ' ')}</span>
              <span className="mono-meta">{o.status}</span>
            </div>
            <h3 style={{ margin: 0 }}>{o.title}</h3>
            {o.startup_name && <p className="card-meta" style={{ margin: 0 }}>{o.startup_name}</p>}
            <p className="card-meta" style={{ margin: 0 }}>{o.description}</p>
            <p className="mono-meta" style={{ margin: 0 }}>
              {[o.location, o.compensation].filter(Boolean).join(' · ')}
            </p>
            <p style={{ margin: 0, fontSize: '0.88rem' }}>
              <strong>Apply:</strong> {o.application_method}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
