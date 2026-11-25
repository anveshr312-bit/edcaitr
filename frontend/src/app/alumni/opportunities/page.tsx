'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { createClient } from '../../../lib/supabase/client';
import { CardGridSkeleton } from '../../../components/ui/Skeleton';

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
  const [deadline, setDeadline] = useState('');
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
      .from('opportunities')
      .select('id, startup_name, listing_type, title, description, skills, location, compensation, application_method, deadline, status')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setItems(data as Opportunity[]);
        setLoading(false);
      });
  }, [supabase]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setNote('');
    try {
      const res = await fetch('/api/alumni/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, listing_type: listingType, startup_name: startupName, description, skills, location, compensation, application_method: applicationMethod, deadline: deadline || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to post opportunity.');
      setItems(prev => [data.opportunity, ...prev]);
      setTitle(''); setStartupName(''); setDescription(''); setSkills(''); setLocation(''); setCompensation(''); setApplicationMethod(''); setDeadline('');
      setNote('Opportunity posted successfully.');
      setShowForm(false);
    } catch (err) {
      setNote(err instanceof Error ? err.message : 'Error.');
    } finally {
      setBusy(false);
    }
  }

  const TYPE_COLOR: Record<string, string> = {
    internship: 'var(--success)',
    job: 'var(--color-3-accent-personality)',
    mentorship: 'var(--accent-ink)',
    collab: 'var(--text-muted)',
  };

  return (
    <div style={{ display: 'grid', gap: 32 }}>
      {/* Light header card */}
      <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-panel)', padding: 'clamp(24px, 3.5vw, 36px)', margin: 0 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 'var(--radius-control)', background: 'var(--accent-tint)', border: '1px solid rgba(224,72,38,0.2)', marginBottom: 10 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-3-accent-personality)' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-3-accent-personality)' }}>
            Alumni Connect
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: '0 0 6px', fontSize: 'clamp(1.5rem, 2.8vw, 2.2rem)', fontWeight: 700, lineHeight: 1.15, color: 'var(--text-primary)' }}>
              Opportunities
            </h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>
              Internships, job openings, and mentorship opportunities across alumni ventures.
            </p>
          </div>
          <button className="btn btn-primary" style={{ fontSize: 13 }} onClick={() => setShowForm(f => !f)}>
            {showForm ? 'Cancel' : '+ Post Opportunity'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[{ label: 'Directory', href: '/alumni/directory' }, { label: 'Startups', href: '/alumni/startups' }, { label: 'Opportunities', href: '/alumni/opportunities' }, { label: 'Messages', href: '/alumni/messages' }].map(({ label, href }) => (
            <a key={href} href={href} style={{ padding: '6px 14px', borderRadius: 'var(--radius-control)', background: href === '/alumni/opportunities' ? 'var(--color-3-accent-personality)' : 'var(--surface-subtle)', color: href === '/alumni/opportunities' ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border-hairline)', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>
              {label}
            </a>
          ))}
        </div>
      </div>

      {note && <p role="status" aria-live="polite" style={{ margin: 0, color: 'var(--accent-ink)', fontWeight: 500 }}>{note}</p>}

      {/* Post form */}
      {showForm && (
        <section className="card" style={{ maxWidth: 580, padding: '28px' }}>
          <h2 style={{ margin: '0 0 20px', fontSize: '1.1rem', fontWeight: 700 }}>Post an Opportunity</h2>
          <form onSubmit={submit} style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>Title *</span>
                <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Frontend Intern" />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>Type</span>
                <select value={listingType} onChange={e => setListingType(e.target.value)}>
                  <option value="internship">Internship</option><option value="job">Job</option>
                  <option value="mentorship">Mentorship</option><option value="collab">Collaboration</option>
                </select>
              </label>
            </div>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>Startup / Company Name</span>
              <input type="text" value={startupName} onChange={e => setStartupName(e.target.value)} />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>Description *</span>
              <textarea rows={3} required value={description} onChange={e => setDescription(e.target.value)} style={{ font: 'inherit', padding: '8px 12px', resize: 'vertical', border: '1.5px solid var(--border-hairline)', borderRadius: 6 }} />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>Skills / Requirements</span>
                <input type="text" value={skills} onChange={e => setSkills(e.target.value)} placeholder="e.g. React, Python" />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>Location</span>
                <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Remote / Indore" />
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>Compensation</span>
                <input type="text" value={compensation} onChange={e => setCompensation(e.target.value)} placeholder="e.g. ₹8,000/mo" />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>Deadline</span>
                <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
              </label>
            </div>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>How to Apply *</span>
              <input type="text" required value={applicationMethod} onChange={e => setApplicationMethod(e.target.value)} placeholder="Email hr@startup.in or use contact form" />
            </label>
            <button type="submit" className="btn btn-primary" disabled={busy} style={{ width: 'fit-content' }}>
              {busy ? 'Posting…' : 'Post Opportunity'}
            </button>
          </form>
        </section>
      )}

      {/* Opportunities list */}
      {loading ? (
        <CardGridSkeleton count={4} />
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p className="card-meta" style={{ margin: 0 }}>No active opportunities posted yet.</p>
        </div>
      ) : (
        <div className="grid">
          {items.map(o => (
            <article key={o.id} className="card">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: TYPE_COLOR[o.listing_type] ?? 'var(--text-muted)' }}>{o.listing_type}</span>
                {o.startup_name && <span className="badge">{o.startup_name}</span>}
              </div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>{o.title}</h3>
              <p className="card-meta" style={{ margin: 0 }}>{o.description}</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {o.location && <span className="mono-meta">{o.location}</span>}
                {o.compensation && <span className="mono-meta">{o.compensation}</span>}
                {o.deadline && <span className="mono-meta">Deadline: {new Date(o.deadline).toLocaleDateString('en-IN')}</span>}
              </div>
              {o.skills && <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Skills: {o.skills}</p>}
              <div style={{ marginTop: 'auto', paddingTop: 10 }}>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic' }}>How to apply: {o.application_method}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
