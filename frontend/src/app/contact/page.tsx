'use client';

import { useState, type FormEvent } from 'react';

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
    setBusy(true); setStatus(''); setIsError(false);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to send inquiry.');
      setStatus('Thank you! Your inquiry has been received by EDC AITR.');
      setName(''); setEmail(''); setSubject(''); setMessage('');
    } catch (err) {
      setIsError(true);
      setStatus(err instanceof Error ? err.message : 'Unable to submit inquiry.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Dark header */}
      <div style={{ background: 'var(--color-2-mood)', color: 'var(--color-1-mood)', padding: '48px 36px', marginLeft: -24, marginRight: -24, marginTop: -24 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(251,249,245,0.4)', margin: '0 0 10px' }}>EDC AITR</p>
        <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(1.8rem,3.5vw,2.6rem)', fontWeight: 800, lineHeight: 1.1 }}>Contact Us</h1>
        <p style={{ margin: 0, color: 'rgba(251,249,245,0.65)', fontSize: 15, maxWidth: 540 }}>
          Questions about events, collaborations, or speaking opportunities? Send us a message.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr)', gap: 48, marginTop: 48, alignItems: 'start' }}>
        {/* Form */}
        <div className="card" style={{ padding: '32px 28px' }}>
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
                  <input type="text" required minLength={2} maxLength={120} value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>Email Address *</span>
                  <input type="email" required maxLength={160} value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
                </label>
              </div>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>Subject *</span>
                <input type="text" required minLength={3} maxLength={160} value={subject} onChange={e => setSubject(e.target.value)} />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>Message *</span>
                <textarea
                  required minLength={10} maxLength={2000} rows={5}
                  value={message} onChange={e => setMessage(e.target.value)}
                  style={{ font: 'inherit', padding: '10px 14px', resize: 'vertical', border: '1.5px solid var(--border-hairline)', borderRadius: 6 }}
                />
              </label>
              {status && isError && (
                <p role="status" aria-live="polite" style={{ margin: 0, color: 'var(--danger)', fontSize: 14 }}>{status}</p>
              )}
              <button type="submit" className="btn btn-primary" disabled={busy} style={{ width: 'fit-content' }}>
                {busy ? 'Sending…' : 'Send Message'}
              </button>
            </form>
          )}
        </div>

        {/* Contact info sidebar */}
        <aside style={{ display: 'grid', gap: 20 }}>
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>About EDC AITR</h3>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
              Entrepreneurship Development Cell at Acropolis Institute of Technology &amp; Research,
              Indore, Madhya Pradesh.
            </p>
          </div>
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Response Time</h3>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
              We typically respond within 2–3 business days. For event-specific queries,
              please mention the event name in your subject.
            </p>
          </div>
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Quick Links</h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {[{ label: 'Browse Events', href: '/events' }, { label: 'Meet the Team', href: '/team' }, { label: 'Create Account', href: '/account' }].map(({ label, href }) => (
                <a key={href} href={href} style={{ fontSize: 14, color: 'var(--color-3-accent-personality)', textDecoration: 'none', fontWeight: 500 }}>
                  {label} →
                </a>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
