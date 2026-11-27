'use client';

import { useState, type FormEvent } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import ImageUploadField from '../../../../components/ImageUploadField';
import {
  parseEventFoodConfig,
  type EventFoodConfig,
  MEAL_THEMES,
} from '../../../../lib/events/foodCoupons';

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
    poster_ref?: string | null;
    published_social_links?: any;
  };
  initialSpocs: Spoc[];
  initialGuests: Guest[];
  candidates: Candidate[];
}) {
  const [status, setStatus] = useState(event.status);
  const [venue, setVenue] = useState(event.venue ?? '');
  const [summary, setSummary] = useState(event.summary ?? '');
  const [posterRef, setPosterRef] = useState(event.poster_ref ?? '');
  const [foodConfig, setFoodConfig] = useState<EventFoodConfig>(() =>
    parseEventFoodConfig(event)
  );
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
        body: JSON.stringify({
          status,
          venue,
          summary,
          poster_ref: posterRef || null,
          food_coupon_config: foodConfig,
        }),
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
          <ImageUploadField label="Event Thumbnail / Poster" folder="events" value={posterRef} onChange={setPosterRef} />

          {/* Food Coupons Configuration */}
          <div style={{ marginTop: 24, padding: 16, border: '1px solid var(--border-hairline)', borderRadius: 12, background: 'var(--surface-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <strong style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem' }}>
                  <UtensilsCrossed style={{ width: 16, height: 16, color: '#10B981' }} />
                  Food Coupons &amp; Catering Passes
                </strong>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Issue scannable meal coupons with auto-tearing QR codes to registered participants.
                </p>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', margin: 0 }}>
                <input
                  type="checkbox"
                  checked={foodConfig.enabled}
                  onChange={(e) => setFoodConfig((prev) => ({ ...prev, enabled: e.target.checked }))}
                />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Enable Food Coupons</span>
              </label>
            </div>

            {foodConfig.enabled && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 16 }}>
                {(['breakfast', 'lunch', 'high_tea', 'dinner'] as const).map((mealType) => {
                  const theme = MEAL_THEMES[mealType];
                  const meal = foodConfig.meals[mealType];
                  return (
                    <div
                      key={mealType}
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        border: `1px solid ${meal.enabled ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-hairline)'}`,
                        background: 'var(--surface)',
                      }}
                    >
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginBottom: 8 }}>
                        <input
                          type="checkbox"
                          checked={meal.enabled}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setFoodConfig((prev) => ({
                              ...prev,
                              meals: {
                                ...prev.meals,
                                [mealType]: { ...prev.meals[mealType], enabled: checked },
                              },
                            }));
                          }}
                        />
                        <span>{theme.icon}</span>
                        <strong style={{ fontSize: '0.85rem' }}>{theme.title}</strong>
                      </label>

                      {meal.enabled && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                          <label style={{ fontSize: '0.75rem', margin: 0 }}>
                            Quantity per attendee
                            <input
                              type="number"
                              min={1}
                              max={10}
                              value={meal.quantity}
                              onChange={(e) => {
                                const qty = Math.max(1, parseInt(e.target.value) || 1);
                                setFoodConfig((prev) => ({
                                  ...prev,
                                  meals: {
                                    ...prev.meals,
                                    [mealType]: { ...prev.meals[mealType], quantity: qty },
                                  },
                                }));
                              }}
                              style={{ width: '100%', marginTop: 4, padding: '4px 8px' }}
                            />
                          </label>

                          <input
                            type="text"
                            value={meal.title || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFoodConfig((prev) => ({
                                ...prev,
                                meals: {
                                  ...prev.meals,
                                  [mealType]: { ...prev.meals[mealType], title: val },
                                },
                              }));
                            }}
                            placeholder={`Label (e.g. Day 1 ${theme.title})`}
                            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

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
