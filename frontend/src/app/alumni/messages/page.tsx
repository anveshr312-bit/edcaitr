'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../../lib/supabase/client';
import { CardGridSkeleton } from '../../../components/ui/Skeleton';

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

const STATUS_COLOR: Record<string, string> = {
  pending: 'var(--accent-ink)',
  accepted: 'var(--success)',
  declined: 'var(--danger)',
};

export default function AlumniMessagesPage() {
  const [supabase] = useState(() => createClient());
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadInbox() {
    if (!supabase) return;
    const { data } = await supabase
      .from('alumni_conversations')
      .select('*')
      .order('updated_at', { ascending: false });
    if (data) setConversations(data as Conversation[]);
  }

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
        await loadInbox();
        const { data: msgs } = await supabase
          .from('alumni_messages')
          .select('id, conversation_id, sender_id, body, created_at')
          .order('created_at', { ascending: true });
        if (msgs) setMessages(msgs as Message[]);
      }
      setLoading(false);
    });
  }, [supabase]); // eslint-disable-line react-hooks/exhaustive-deps

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
    const text = reply.trim();
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      conversation_id: selectedId,
      sender_id: userId ?? '',
      body: text,
      created_at: new Date().toISOString(),
    };
    setNote('');
    setReply('');
    setMessages(prev => [...prev, optimisticMsg]);

    const res = await fetch('/api/alumni/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_id: selectedId, body: text }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setReply(text);
      setNote(data.error ?? 'Could not send message.');
    } else {
      setMessages(prev => prev.map(m => (m.id === tempId ? data.message : m)));
    }
  }

  const activeConv = conversations.find(c => c.id === selectedId);
  const activeMsgs = messages.filter(m => m.conversation_id === selectedId);

  return (
    <div style={{ display: 'grid', gap: 32 }}>
      {/* Header */}
      <div style={{ background: 'var(--color-2-mood)', color: 'var(--color-1-mood)', padding: '40px 36px', marginLeft: -24, marginRight: -24, marginTop: -24 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(251,249,245,0.4)', margin: '0 0 8px' }}>Alumni Connect</p>
        <h1 style={{ margin: '0 0 20px', fontSize: 'clamp(1.4rem,2.5vw,2rem)', fontWeight: 700 }}>Messages</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ label: 'Directory', href: '/alumni/directory' }, { label: 'Startups', href: '/alumni/startups' }, { label: 'Opportunities', href: '/alumni/opportunities' }, { label: 'Messages', href: '/alumni/messages' }].map(({ label, href }) => (
            <a key={href} href={href} style={{ padding: '6px 14px', borderRadius: 4, background: href === '/alumni/messages' ? 'var(--color-3-accent-personality)' : 'rgba(251,249,245,0.1)', color: href === '/alumni/messages' ? '#fff' : 'rgba(251,249,245,0.8)', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>
              {label}
            </a>
          ))}
        </div>
      </div>

      {note && <p role="status" aria-live="polite" style={{ margin: 0, color: 'var(--accent-ink)', fontWeight: 500 }}>{note}</p>}

      {loading ? (
        <CardGridSkeleton count={3} />
      ) : conversations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '56px 24px' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border-hairline)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 16px' }}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <p className="card-meta" style={{ margin: 0 }}>No conversations yet. Start a contact request from the <a href="/alumni/directory">Directory</a>.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px,280px) 1fr', gap: 20, alignItems: 'start' }}>
          {/* Conversation list */}
          <div style={{ display: 'grid', gap: 8 }}>
            <h2 style={{ margin: '0 0 12px', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', borderLeft: '3px solid var(--color-3-accent-personality)', paddingLeft: 10 }}>
              Conversations ({conversations.length})
            </h2>
            {conversations.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedId(c.id)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
                  padding: '12px 14px', textAlign: 'left', borderRadius: 6, cursor: 'pointer',
                  border: `2px solid ${selectedId === c.id ? 'var(--color-3-accent-personality)' : 'var(--border-hairline)'}`,
                  background: selectedId === c.id ? 'var(--accent-tint)' : 'var(--surface)',
                  transition: 'border-color 0.15s',
                }}
              >
                <span className="mono-meta" style={{ fontSize: 12 }}>#{c.id.slice(0, 8)}</span>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: STATUS_COLOR[c.request_status] ?? 'var(--text-muted)' }}>
                  {c.request_status}
                </span>
              </button>
            ))}
          </div>

          {/* Thread view */}
          {activeConv ? (
            <div className="card" style={{ display: 'grid', gap: 16 }}>
              {/* Actions bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: STATUS_COLOR[activeConv.request_status], textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {activeConv.request_status}
                </span>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {activeConv.request_status === 'pending' && activeConv.recipient_id === userId && (
                    <>
                      <button type="button" className="btn btn-primary" style={{ fontSize: 13, padding: '6px 14px' }} onClick={() => void handleAction(activeConv.id, 'accept')}>Accept</button>
                      <button type="button" className="btn" style={{ fontSize: 13, padding: '6px 14px' }} onClick={() => void handleAction(activeConv.id, 'decline')}>Decline</button>
                    </>
                  )}
                  <button type="button" className="btn" style={{ fontSize: 12, padding: '5px 12px', color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => void handleAction(activeConv.id, 'block')}>Block</button>
                  <button type="button" className="btn" style={{ fontSize: 12, padding: '5px 12px' }} onClick={() => void handleAction(activeConv.id, 'report')}>Report</button>
                </div>
              </div>

              {/* Messages */}
              <div style={{ display: 'grid', gap: 10, maxHeight: 360, overflowY: 'auto', padding: '4px 0' }}>
                {activeMsgs.map((m) => {
                  const isOwn = m.sender_id === userId;
                  return (
                    <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
                      <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: 10, background: isOwn ? 'var(--color-2-mood)' : 'var(--surface-subtle)', color: isOwn ? 'var(--color-1-mood)' : 'var(--text-primary)', fontSize: 14, lineHeight: 1.55 }}>
                        {m.body}
                      </div>
                      <div className="mono-meta" style={{ marginTop: 3, fontSize: 11 }}>
                        {isOwn ? 'You' : 'Member'} · {new Date(m.created_at).toLocaleTimeString('en-IN', { timeStyle: 'short' })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply */}
              {activeConv.request_status !== 'declined' && (
                <div style={{ display: 'flex', gap: 10, borderTop: '1px solid var(--border-hairline)', paddingTop: 14 }}>
                  <input
                    type="text"
                    placeholder="Write a reply…"
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendReply(); } }}
                    style={{ flex: 1 }}
                  />
                  <button type="button" className="btn btn-primary" style={{ fontSize: 14, padding: '8px 20px' }} onClick={() => void sendReply()}>Send</button>
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px', color: 'var(--text-muted)' }}>
              Select a conversation to view
            </div>
          )}
        </div>
      )}
    </div>
  );
}
