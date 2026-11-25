'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../../lib/supabase/client';

interface Conversation {
  id: string;
  initiator_id: string;
  recipient_id: string;
  request_status: 'pending' | 'accepted' | 'declined';
  updated_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export default function AlumniMessagesPage() {
  const [supabase] = useState(() => createClient());
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [note, setNote] = useState('');

  async function loadInbox() {
    if (!supabase) return;
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    setUserId(auth.user.id);

    const [{ data: convs }, { data: msgs }] = await Promise.all([
      supabase.from('conversations').select('*').order('updated_at', { ascending: false }),
      supabase.from('messages').select('*').order('created_at', { ascending: true }),
    ]);

    if (convs) {
      setConversations(convs as Conversation[]);
      if (!selectedId && convs.length > 0) setSelectedId(convs[0].id);
    }
    if (msgs) setMessages(msgs as Message[]);
  }

  useEffect(() => {
    void loadInbox();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  async function handleAction(convId: string, action: 'accept' | 'decline' | 'block' | 'report') {
    setNote('');
    const res = await fetch('/api/alumni/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_id: convId, action }),
    });
    const data = await res.json();
    if (!res.ok) {
      setNote(data.error ?? 'Action failed.');
    } else {
      setNote(`Action "${action}" completed.`);
      await loadInbox();
    }
  }

  async function sendReply() {
    if (!selectedId || !reply.trim()) return;
    setNote('');
    const res = await fetch('/api/alumni/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_id: selectedId, body: reply.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setNote(data.error ?? 'Could not send message.');
    } else {
      setMessages((prev) => [...prev, data.message]);
      setReply('');
    }
  }

  const activeConv = conversations.find((c) => c.id === selectedId);
  const activeMsgs = messages.filter((m) => m.conversation_id === selectedId);

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {note && (
        <p role="status" aria-live="polite" style={{ color: 'var(--accent-ink)', margin: 0 }}>
          {note}
        </p>
      )}

      {conversations.length === 0 ? (
        <div className="card">
          <p className="card-meta" style={{ margin: 0 }}>
            No conversations yet. Start a contact request from the Directory tab.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 280px) 1fr', gap: 20 }}>
          <div style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
            {conversations.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedId(c.id)}
                style={{
                  justifyContent: 'space-between',
                  borderColor: selectedId === c.id ? 'var(--color-3-accent-personality)' : 'var(--border-hairline)',
                }}
              >
                <span className="mono-meta">#{c.id.slice(0, 8)}</span>
                <span className="badge">{c.request_status}</span>
              </button>
            ))}
          </div>

          {activeConv && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <span className="badge badge-accent">Status: {activeConv.request_status}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {activeConv.request_status === 'pending' && activeConv.recipient_id === userId && (
                    <>
                      <button type="button" className="btn-primary" onClick={() => void handleAction(activeConv.id, 'accept')}>
                        Accept
                      </button>
                      <button type="button" onClick={() => void handleAction(activeConv.id, 'decline')}>
                        Decline
                      </button>
                    </>
                  )}
                  <button type="button" onClick={() => void handleAction(activeConv.id, 'block')}>
                    Block
                  </button>
                  <button type="button" onClick={() => void handleAction(activeConv.id, 'report')}>
                    Report
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 10, margin: '16px 0' }}>
                {activeMsgs.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: m.sender_id === userId ? 'var(--surface-subtle)' : 'var(--color-1-mood)',
                      border: '1px solid var(--border-hairline)',
                    }}
                  >
                    <div className="mono-meta" style={{ marginBottom: 4 }}>
                      {m.sender_id === userId ? 'You' : 'Member'} · {new Date(m.created_at).toLocaleString('en-IN')}
                    </div>
                    <div>{m.body}</div>
                  </div>
                ))}
              </div>

              {activeConv.request_status !== 'declined' && (
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    type="text"
                    placeholder="Write a reply..."
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button type="button" className="btn-primary" onClick={() => void sendReply()}>
                    Send
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
