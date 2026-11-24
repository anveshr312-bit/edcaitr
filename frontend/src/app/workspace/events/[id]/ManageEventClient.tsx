'use client';

import { useState, type FormEvent } from 'react';
import ImageUploadField from '../../../../components/ImageUploadField';

interface Spoc {
  user_id: string;
  is_primary: boolean;
  full_name: string;
  designation: string | null;
}

interface Guest {
  id: string;
  full_name: string;
  title: string | null;
  bio: string | null;
  linkedin_url: string | null;
  photo_ref: string | null;
  private_contact: string | null;
}

interface Candidate {
  id: string;
  full_name: string;
  designation: string | null;
  role: string;
}

export default function ManageEventClient({
  event,
  initialSpocs,
  initialGuests,
  candidates,
}: {
  event: {
    id: string;
    title: string;
    status: string;
    venue: string | null;
    summary: string | null;
  };
  initialSpocs: Spoc[];
  initialGuests: Guest[];
  candidates: Candidate[];
}) {
  const [status, setStatus] = useState(event.status);
  const [venue, setVenue] = useState(event.venue ?? '');
  const [summary, setSummary] = useState(event.summary ?? '');
  const [spocs, setSpocs] = useState<Spoc[]>(initialSpocs);
  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [spocSearch, setSpocSearch] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestTitle, setGuestTitle] = useState('');
  const [guestLinkedin, setGuestLinkedin] = useState('');
  const [guestPhoto, setGuestPhoto] = useState('');
  const [guestContact, setGuestContact] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function saveOverview(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, venue, summary }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Update failed.');
      setMessage('Event details updated.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Update failed.');
    } finally {
      setBusy(false);
    }
  }

  async function addSpoc(candidate: Candidate) {
    setBusy(true);
    setMessage('');
    try {
      const res = await fetch(`/api/events/${event.id}/spocs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: candidate.id, is_primary: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not add SPOC.');
      setSpocs((prev) => [
        ...prev,
        {
          user_id: candidate.id,
          is_primary: false,
          full_name: candidate.full_name,
          designation: candidate.designation,
        },
      ]);
      setSpocSearch('');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not add SPOC.');
    } finally {
      setBusy(false);
    }
  }

  async function removeSpoc(userId: string) {
    setBusy(true);
    setMessage('');
    try {
      const res = await fetch(`/api/events/${event.id}/spocs?user_id=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not remove SPOC.');
      setSpocs((prev) => prev.filter((s) => s.user_id !== userId));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not remove SPOC.');
    } finally {
      setBusy(false);
    }
  }

  async function addGuest(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const res = await fetch(`/api/events/${event.id}/guests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: guestName,
          title: guestTitle,
          linkedin_url: guestLinkedin,
          photo_ref: guestPhoto,
          private_contact: guestContact,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not add guest.');
      setGuests((prev) => [...prev, data.guest]);
      setGuestName('');
      setGuestTitle('');
      setGuestLinkedin('');
      setGuestPhoto('');
      setGuestContact('');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not add guest.');
    } finally {
      setBusy(false);
    }
  }

  async function removeGuest(guestId: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/events/${event.id}/guests?guest_id=${encodeURIComponent(guestId)}`, {
        method: 'DELETE',
      });
      if (res.ok) setGuests((prev) => prev.filter((g) => g.id !== guestId));
    } finally {
      setBusy(false);
    }
  }

  const availableCandidates = candidates.filter(
    (c) =>
      !spocs.some((s) => s.user_id === c.id) &&
      (spocSearch.trim() === '' || c.full_name.toLowerCase().includes(spocSearch.toLowerCase()))
  );

  return (
    <div style={{ display: 'grid', gap: 28 }}>
      <section className="card">
        <h2>Event Status &amp; Overview</h2>
        <form onSubmit={saveOverview}>
          <label>
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="ongoing">Ongoing</option>
              <option value="wrap_up">Wrap-up</option>
              <option value="closed">Closed</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <label>
            Summary
            <input type="text" value={summary} onChange={(e) => setSummary(e.target.value)} />
          </label>
          <label>
            Venue
            <input type="text" value={venue} onChange={(e) => setVenue(e.target.value)} />
          </label>
          <button type="submit" disabled={busy}>
            Save Changes
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Event Leads (SPOCs)</h2>
        <ul style={{ paddingLeft: 20, margin: '0 0 12px' }}>
          {spocs.map((s) => (
            <li key={s.user_id} style={{ marginBottom: 6 }}>
              <strong>{s.full_name}</strong>
              {s.is_primary && <span className="badge badge-accent" style={{ marginLeft: 8 }}>Primary</span>}{' '}
              {spocs.length > 1 && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void removeSpoc(s.user_id)}
                  style={{ padding: '2px 8px', fontSize: '0.8rem', marginLeft: 8 }}
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>

        <label style={{ maxWidth: 360 }}>
          Add another SPOC
          <input
            type="search"
            placeholder="Search approved team members..."
            value={spocSearch}
            onChange={(e) => setSpocSearch(e.target.value)}
          />
        </label>
        {spocSearch && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            {availableCandidates.slice(0, 6).map((c) => (
              <button key={c.id} type="button" disabled={busy} onClick={() => void addSpoc(c)}>
                + {c.full_name}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <h2>Guests &amp; Speakers</h2>
        {guests.length > 0 && (
          <ul style={{ paddingLeft: 20, margin: '0 0 16px' }}>
            {guests.map((g) => (
              <li key={g.id} style={{ marginBottom: 8 }}>
                <strong>{g.full_name}</strong>
                {g.title ? ` · ${g.title}` : ''}
                {g.private_contact ? ` (Contact: ${g.private_contact})` : ''}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void removeGuest(g.id)}
                  style={{ padding: '2px 8px', fontSize: '0.8rem', marginLeft: 8 }}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={addGuest}>
          <label>
            Guest Name *
            <input type="text" required value={guestName} onChange={(e) => setGuestName(e.target.value)} />
          </label>
          <label>
            Title / Organization
            <input type="text" value={guestTitle} onChange={(e) => setGuestTitle(e.target.value)} />
          </label>
          <label>
            LinkedIn URL
            <input type="url" value={guestLinkedin} onChange={(e) => setGuestLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." />
          </label>
          <ImageUploadField label="Guest Photo" folder="guests" value={guestPhoto} onChange={setGuestPhoto} />
          <label>
            Private Contact (hidden from public page)
            <input type="text" value={guestContact} onChange={(e) => setGuestContact(e.target.value)} />
          </label>
          <button type="submit" disabled={busy}>
            Add Guest
          </button>
        </form>
      </section>

      {message && (
        <p role="status" aria-live="polite" style={{ color: 'var(--accent)', fontWeight: 500 }}>
          {message}
        </p>
      )}
    </div>
  );
}
