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

      setStatus('Thank you! Your inquiry has been received by E-Cell AITR.');
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
    <>
      <h1>Contact Us</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
        Have a question about E-Cell AITR events, collaborations, or speaking opportunities? Send us a
        message below.
      </p>

      <div className="card" style={{ maxWidth: 540 }}>
        <form onSubmit={handleSubmit} style={{ maxWidth: '100%' }}>
          <label>
            Full Name *
            <input
              type="text"
              required
              minLength={2}
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            Email Address *
            <input
              type="email"
              required
              maxLength={160}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Subject *
            <input
              type="text"
              required
              minLength={3}
              maxLength={160}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </label>
          <label>
            Message *
            <textarea
              required
              minLength={10}
              maxLength={2000}
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </label>
          <button type="submit" disabled={busy}>
            {busy ? 'Sending…' : 'Send Message'}
          </button>
        </form>

        {status && (
          <p
            role="status"
            aria-live="polite"
            style={{ color: isError ? 'var(--danger)' : 'var(--success)', marginBottom: 0 }}
          >
            {status}
          </p>
        )}
      </div>
    </>
  );
}
