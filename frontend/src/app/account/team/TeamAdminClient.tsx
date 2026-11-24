'use client';

import { useState } from 'react';

interface Member {
  id: string;
  user_id: string;
  role: string;
  effective_from: string | null;
  full_name: string;
  designation: string | null;
}

interface Props {
  members: Member[];
  currentUserId: string;
  isDirector: boolean;
}

export default function TeamAdminClient({ members: initial, currentUserId, isDirector }: Props) {
  const [members, setMembers] = useState<Member[]>(initial);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});

  async function nominate(member: Member) {
    const statement = notes[member.user_id]?.trim() ?? '';
    if (statement.length < 20) {
      setMessages(m => ({ ...m, [member.user_id]: 'Enter a nomination statement (min 20 characters).' }));
      return;
    }
    setBusy(b => ({ ...b, [member.user_id]: true }));
    setMessages(m => ({ ...m, [member.user_id]: '' }));
    try {
      const res = await fetch('/api/applications/nominate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomineeId: member.user_id, statement }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? 'Nomination failed.');
      setMessages(m => ({ ...m, [member.user_id]: 'Promotion nomination submitted for Director review.' }));
      setNotes(n => ({ ...n, [member.user_id]: '' }));
    } catch (err) {
      setMessages(m => ({ ...m, [member.user_id]: err instanceof Error ? err.message : 'Failed.' }));
    } finally {
      setBusy(b => ({ ...b, [member.user_id]: false }));
    }
  }

  async function revoke(member: Member, newStatus: 'departed' | 'suspended') {
    const reason = notes[member.user_id]?.trim() ?? '';
    if (!reason) {
      setMessages(m => ({ ...m, [member.user_id]: 'Enter a reason before updating membership status.' }));
      return;
    }
    setBusy(b => ({ ...b, [member.user_id]: true }));
    setMessages(m => ({ ...m, [member.user_id]: '' }));
    try {
      const res = await fetch('/api/memberships/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: member.user_id, newStatus, reason }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? 'Action failed.');
      setMembers(prev => prev.filter(m => m.user_id !== member.user_id));
    } catch (err) {
      setMessages(m => ({ ...m, [member.user_id]: err instanceof Error ? err.message : 'Failed.' }));
    } finally {
      setBusy(b => ({ ...b, [member.user_id]: false }));
    }
  }

  if (members.length === 0) {
    return <p style={{ color: '#555' }}>No active organization members found.</p>;
  }

  return (
    <section style={{ display: 'grid', gap: 16 }}>
      {members.map(member => {
        const isSelf = member.user_id === currentUserId;
        const isBusy = busy[member.user_id] ?? false;
        return (
          <article key={member.id} style={{ border: '1px solid #ccd2da', borderRadius: 8, padding: 16 }}>
            <div style={{ marginBottom: 8 }}>
              <strong>{member.full_name}</strong>
              {member.designation && <span style={{ color: '#555', marginLeft: 8 }}>· {member.designation}</span>}
              <span style={{ float: 'right', fontSize: 13, color: '#555' }}>
                {member.role.replace('_', ' ')} {member.effective_from ? `since ${member.effective_from}` : ''}
              </span>
            </div>

            {!isSelf && (member.role === 'core_team' || isDirector) && (
              <>
                <label style={{ marginBottom: 8 }}>
                  Nomination statement / Departure reason
                  <input
                    type="text"
                    maxLength={500}
                    value={notes[member.user_id] ?? ''}
                    onChange={e => setNotes(n => ({ ...n, [member.user_id]: e.target.value }))}
                    placeholder="Required for nomination (20+ chars) or departure/suspension"
                    disabled={isBusy}
                  />
                </label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {member.role === 'core_team' && (
                    <button type="button" disabled={isBusy} onClick={() => void nominate(member)}>
                      Nominate for Advisor
                    </button>
                  )}
                  {isDirector && (
                    <>
                      <button type="button" disabled={isBusy} onClick={() => void revoke(member, 'departed')}>
                        Mark Departed
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void revoke(member, 'suspended')}
                        style={{ background: '#c62828', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 16px' }}
                      >
                        Suspend
                      </button>
                    </>
                  )}
                </div>
              </>
            )}

            {messages[member.user_id] && (
              <p role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 13, color: '#555' }}>
                {messages[member.user_id]}
              </p>
            )}
          </article>
        );
      })}
    </section>
  );
}
