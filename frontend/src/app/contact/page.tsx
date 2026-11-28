'use client';

import { useState, type FormEvent } from 'react';
import { Mail, MapPin, Building, Clock, ArrowRight, Camera } from 'lucide-react';

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

      setStatus('Thank you. Your message has been received by the EDC AITR Secretariat.');
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
    <div style={{ display: 'grid', gap: 48 }}>
      {/* Light Header Band */}
      <section className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-panel)', padding: 'clamp(28px, 4vw, 44px)', margin: 0 }}>
        <div style={{ maxWidth: 1100 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 4, background: 'var(--accent-tint)', border: '1px solid rgba(192,30,48,0.2)', marginBottom: 12 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-3-accent-personality)' }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.02em', color: 'var(--color-3-accent-personality)' }}>
              Institutional Inquiries
            </span>
          </div>
          <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(1.8rem, 3.2vw, 2.6rem)', fontWeight: 800, lineHeight: 1.15, color: 'var(--text-primary)' }}>
            Contact &amp; Partnerships
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 15, maxWidth: 640, lineHeight: 1.65 }}>
            Partner with E-Summit 2026, sponsor an event track, inquire about startup pitching, or connect with the EDC AITR Secretariat and AIIH Foundation.
          </p>
        </div>
      </section>

      {/* Main Grid: Form Left, Institutional Info Right */}
      <section style={{ maxWidth: 1100, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: 'minmax(0,1.3fr) minmax(280px,1fr)', gap: 36, alignItems: 'start' }}>
        {/* Form Card */}
        <div className="card" style={{ padding: '32px 28px' }}>
          <h2 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 800 }}>Send Us a Message</h2>
          <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--text-secondary)' }}>
            Inquiries are routed directly to the cell coordinators and responded to within 1–2 working days.
          </p>

          {status && !isError ? (
            <div style={{ padding: '24px', background: 'rgba(21,128,61,0.08)', border: '1px solid rgba(21,128,61,0.2)', borderRadius: 8, textAlign: 'center' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 12px' }}>
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <p style={{ margin: 0, color: 'var(--success)', fontWeight: 600 }}>{status}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
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
                <span style={{ fontWeight: 600, fontSize: 13 }}>Subject / Partnership Track *</span>
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

        {/* Sidebar: Official Desk Channels & Campus Location */}
        <aside style={{ display: 'grid', gap: 18 }}>
          {/* Official Secretariat Desks Card */}
          <div className="card" style={{ padding: '22px 24px', background: 'var(--surface)', border: '1px solid var(--border-hairline)' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
              Official Communication Channels
            </h3>
            <div style={{ display: 'grid', gap: 14 }}>
              <div style={{ borderBottom: '1px solid var(--border-hairline)', paddingBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>General Secretariat &amp; Inquiries</div>
                <div style={{ fontSize: 13, color: 'var(--color-3-accent-personality)', marginTop: 2, fontFamily: 'monospace' }}>
                  edc@acropolis.in
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Official mailbox for student queries, memberships, and institutional notices.
                </div>
              </div>

              <div style={{ borderBottom: '1px solid var(--border-hairline)', paddingBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>Partnerships &amp; Conclave Sponsorships</div>
                <div style={{ fontSize: 13, color: 'var(--color-3-accent-personality)', marginTop: 2, fontFamily: 'monospace' }}>
                  partnerships@acropolis.in
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Corporate tie-ups, event track underwriting, and PitchBiz investor relations.
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>AIIH Foundation Incubation Desk</div>
                <div style={{ fontSize: 13, color: 'var(--color-3-accent-personality)', marginTop: 2, fontFamily: 'monospace' }}>
                  aiih@acropolis.in
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Pre-incubation lab access, prototyping fablab hours, and seed grant routing.
                </div>
              </div>
            </div>
          </div>

          {/* Operating Hours Card */}
          <div className="card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Clock style={{ width: 16, height: 16, color: 'var(--color-3-accent-personality)' }} />
              <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Office Working Hours
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              Monday – Saturday · 09:30 to 17:30 IST
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
              Closed on 2nd &amp; 4th Saturdays, Sundays, and public holidays.
            </p>
          </div>

          {/* Official Instagram Card */}
          <div className="card" style={{ padding: '20px 24px', background: 'var(--surface)', border: '1px solid var(--border-hairline)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Camera style={{ width: 18, height: 18, color: 'var(--color-3-accent-personality)' }} />
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Official Instagram</h3>
            </div>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Live conclave broadcasts, speaker announcements, and event highlights.
            </p>
            <a
              href="https://www.instagram.com/edc_acropolis"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ fontSize: 12, padding: '6px 14px', width: 'fit-content' }}
            >
              @edc_acropolis →
            </a>
          </div>

          {/* Campus Location Card */}
          <div className="card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <MapPin style={{ width: 16, height: 16, color: 'var(--color-3-accent-personality)' }} />
              <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Campus Venue &amp; Secretariat
              </h3>
            </div>
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700 }}>
              Acropolis Institute of Technology &amp; Research (AITR)
            </p>
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Bypass Road, Manglia Square, Indore, Madhya Pradesh 453771
            </p>
            <div style={{ marginTop: 8, fontSize: 11.5, color: 'var(--text-muted)' }}>
              Transit: Direct Acropolis institutional transit active from Indore, Dewas, Ujjain, and Maksi.
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
