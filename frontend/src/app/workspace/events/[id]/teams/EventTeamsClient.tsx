'use client';

import { useState, type FormEvent } from 'react';

interface TeamDef {
  code: string;
  name: string;
  description: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  team_code: string;
  is_coordinator: boolean;
  full_name: string;
  designation: string | null;
}

interface Candidate {
  id: string;
  full_name: string;
  designation: string | null;
  role: string;
}

export default function EventTeamsClient({
  eventId,
  teams,
  initialMembers,
  candidates,
  canManage,
}: {
  eventId: string;
  teams: TeamDef[];
  initialMembers: TeamMember[];
  candidates: Candidate[];
  canManage: boolean;
}) {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [selectedTeam, setSelectedTeam] = useState(teams[0]?.code ?? 'RD');
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isCoordinator, setIsCoordinator] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const filteredCandidates = candidates.filter(
    (c) =>
      search.trim() === '' ||
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.designation ?? '').toLowerCase().includes(search.toLowerCase())
  );

  async function assignMember(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedUserId) return;
    setBusy(true);
    setMessage('');
    try {
      const res = await fetch(`/api/events/${eventId}/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUserId,
          team_code: selectedTeam,
          is_coordinator: isCoordinator,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to assign member.');

      const candidate = candidates.find((c) => c.id === selectedUserId);
      setMembers((prev) => [
        ...prev,
        {
          id: data.member.id,
          user_id: selectedUserId,
          team_code: selectedTeam,
          is_coordinator: isCoordinator,
          full_name: candidate?.full_name ?? 'Member',
          designation: candidate?.designation ?? null,
        },
      ]);
      setSelectedUserId('');
      setIsCoordinator(false);
      setMessage('Member assigned to operational team.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Assignment failed.');
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(memberId: string) {
    setBusy(true);
    setMessage('');
    try {
      const res = await fetch(`/api/events/${eventId}/team?member_id=${encodeURIComponent(memberId)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Could not remove member.');
      }
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Remove failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 28 }}>
      {canManage && (
        <section className="card" style={{ maxWidth: 560 }}>
          <h2>Assign Member to Operational Team</h2>
          <form onSubmit={assignMember} style={{ maxWidth: '100%' }}>
            <label>
              Operational Team
              <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)}>
                {teams.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.name} ({t.code})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Search Approved Core Team / Advisors
              <input
                type="search"
                placeholder="Filter by name or designation"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <label>
              Select Member *
              <select required value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
                <option value="">Choose a member</option>
                {filteredCandidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name || 'Unnamed'} ({c.role.replace('_', ' ')}
                    {c.designation ? ` · ${c.designation}` : ''})
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={isCoordinator}
                onChange={(e) => setIsCoordinator(e.target.checked)}
                style={{ width: 'auto' }}
              />
              Assign as team coordinator
            </label>
            <button type="submit" disabled={busy || !selectedUserId}>
              {busy ? 'Assigning…' : 'Assign to Team'}
            </button>
          </form>
          {message && (
            <p role="status" aria-live="polite" style={{ marginBottom: 0, color: 'var(--accent-ink)' }}>
              {message}
            </p>
          )}
        </section>
      )}

      <section className="grid">
        {teams.map((team) => {
          const teamMembers = members.filter((m) => m.team_code === team.code);
          return (
            <article key={team.code} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <h3 style={{ margin: 0 }}>{team.name}</h3>
                <span className="mono-meta">{teamMembers.length}</span>
              </div>
              <p className="card-meta" style={{ margin: 0, fontSize: '0.85rem' }}>
                {team.description}
              </p>
              {teamMembers.length === 0 ? (
                <p className="mono-meta" style={{ margin: 0 }}>
                  No members assigned
                </p>
              ) : (
                <ul style={{ paddingLeft: 18, margin: '8px 0 0' }}>
                  {teamMembers.map((m) => (
                    <li key={m.id} style={{ marginBottom: 6 }}>
                      <strong>{m.full_name}</strong>
                      {m.is_coordinator && (
                        <span className="badge badge-accent" style={{ marginLeft: 6 }}>
                          Coordinator
                        </span>
                      )}
                      {canManage && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void removeMember(m.id)}
                          style={{ padding: '2px 8px', fontSize: '0.78rem', marginLeft: 8 }}
                        >
                          Remove
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}
