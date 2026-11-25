'use client';

import { useState, type FormEvent } from 'react';

const COORDINATORS = [
  {
    name: 'Kavyansh Singh Rajput',
    role: 'Lead Coordinator',
    phone: '+91 8839988997',
    email: 'kavyanshsinghrajput@gmail.com',
  },
  {
    name: 'Pradhyumn Mehta',
    role: 'Event Coordinator',
    phone: '+91 8770527096',
    email: 'pradhyumnmehta231355@acropolis.in',
  },
  {
    name: 'Ishaan Dadoo',
    role: 'Operations Coordinator',
    phone: '+91 6232400399',
    email: 'ishaandadoo230858@acropolis.in',
  },
  {
    name: 'Prince Joshi',
    role: 'Corporate & Media Coordinator',
    phone: '+91 8209657305',
    email: 'princejoshi0290@gmail.com',
  },
];

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [isError, setIsError] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setStatus('');
    setIsError(false);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to send inquiry.');

      setStatus('Thank you! Your message has been received by the EDC AITR team.');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err) {
      setIsError(true);
      setStatus(err instanceof Error ? err.message : 'Unable to submit inquiry.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 64 }}>
      {/* Header Band */}
      <section style={{ background: 'var(--color-2-mood)', color: 'var(--color-1-mood)', padding: '56px clamp(16px,4vw,48px)', marginLeft: -24, marginRight: -24, marginTop: -24 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(251,249,245,0.4)', margin: '0 0 10px' }}>
            Get in Touch
          </p>
          <h1 style={{ margin: '0 0 16px', fontSize: 'clamp(2rem,4vw,3.2rem)', fontWeight: 800, lineHeight: 1.1 }}>
            Contact &amp; Partnerships
          </h1>
          <p style={{ margin: 0, color: 'rgba(251,249,245,0.7)', fontSize: 16, maxWidth: 640, lineHeight: 1.65 }}>
            Partner with E-Summit 2026, sponsor an event track, inquire about startup pitching, or connect with our student coordinators.
          </p>
        </div>
      </section>

      {/* Main Grid: Form Left, Direct Info Right */}
      <section style={{ maxWidth: 1100, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: 'minmax(0,1.3fr) minmax(280px,1fr)', gap: 40, alignItems: 'start' }}>
        {/* Form Card */}
        <div className="card" style={{ padding: '36px 32px' }}>
          <h2 style={{ margin: '0 0 8px', fontSize: '1.3rem', fontWeight: 800 }}>Send Us a Message</h2>
          <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--text-secondary)' }}>
            We typically respond within 1–2 business days. For urgent sponsorship inquiries, please reach out directly to the coordinators listed.
          </p>

          {status && !isError ? (
            <div style={{ padding: '24px', background: 'rgba(21,128,61,0.08)', border: '1px solid rgba(21,128,61,0.2)', borderRadius: 8, textAlign: 'center' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 12px' }}>
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <p style={{ margin: 0, color: 'var(--success)', fontWeight: 600 }}>{status}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>Full Name *</span>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={120}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    placeholder="Your name"
                  />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>Email Address *</span>
                  <input
                    type="email"
                    required
                    maxLength={160}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="you@domain.com"
                  />
                </label>
              </div>

              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>Subject / Partnership Interest *</span>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={160}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. E-Summit 2026 Sponsorship / PitchBiz Inquiry"
                />
              </label>

              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>Message *</span>
                <textarea
                  required
                  minLength={10}
                  maxLength={2000}
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Provide details about your query, startup, or partnership proposal..."
                  style={{ font: 'inherit', padding: '10px 14px', resize: 'vertical', border: '1.5px solid var(--border-hairline)', borderRadius: 6 }}
                />
              </label>

              {status && isError && (
                <p role="status" aria-live="polite" style={{ margin: 0, color: 'var(--danger)', fontSize: 14 }}>
                  {status}
                </p>
              )}

              <button type="submit" className="btn btn-primary" disabled={busy} style={{ width: 'fit-content' }}>
                {busy ? 'Sending…' : 'Submit Inquiry'}
              </button>
            </form>
          )}
        </div>

        {/* Sidebar: Direct Contacts & Campus Information */}
        <aside style={{ display: 'grid', gap: 20 }}>
          {/* Instagram Community Card */}
          <div className="card" style={{ padding: '24px', background: 'var(--color-2-mood)', color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-3-accent-personality)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Official Instagram</h3>
            </div>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: 'rgba(251,249,245,0.7)', lineHeight: 1.55 }}>
              Follow our daily summit reveals, behind-the-scenes preparation, and speaker updates.
            </p>
            <a
              href="https://www.instagram.com/edc_acropolis"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ fontSize: 13, padding: '8px 18px', width: 'fit-content' }}
            >
              @edc_acropolis →
            </a>
          </div>

          {/* Coordinators Card */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
              Direct Student Leads
            </h3>
            <div style={{ display: 'grid', gap: 14 }}>
              {COORDINATORS.map((c) => (
                <div key={c.name} style={{ borderBottom: '1px solid var(--border-hairline)', paddingBottom: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                  <div className="mono-meta" style={{ fontSize: 11, color: 'var(--color-3-accent-personality)', marginBottom: 4 }}>
                    {c.role}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{c.phone}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.email}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Campus Location Card */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
              Campus Venue
            </h3>
            <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700 }}>
              Acropolis Institute of Technology &amp; Research (AITR)
            </p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              Bypass Road, Manglia Square, Indore, Madhya Pradesh 453771
            </p>
            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
              Transit: Direct Acropolis buses operational from Indore, Dewas, Ujjain, and Maksi.
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
