'use client';

import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Check, Loader2 } from 'lucide-react';

interface Props {
  eventId: string;
  className?: string;
}

export function EventReminderButton({ eventId, className = '' }: Props) {
  const [hasReminder, setHasReminder] = useState(false);
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadStatus() {
      try {
        const res = await fetch(`/api/events/${eventId}/reminders`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setHasReminder(Boolean(data.hasReminder));
            setCount(Number(data.count) || 0);
          }
        }
      } catch {}
    }
    loadStatus();
    return () => {
      isMounted = false;
    };
  }, [eventId]);

  const toggleReminder = async () => {
    setBusy(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/events/${eventId}/reminders`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not update reminder.');
      }
      setHasReminder(Boolean(data.hasReminder));
      setCount((prev) => (data.hasReminder ? prev + 1 : Math.max(0, prev - 1)));
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Action failed.');
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={toggleReminder}
        disabled={busy}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
          hasReminder
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
            : 'border-border/60 bg-secondary/60 text-foreground hover:bg-secondary hover:border-border'
        } ${className}`}
        title={hasReminder ? 'Reminder set (click to remove)' : 'Notify me about schedule updates & cancellation notices'}
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : hasReminder ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Bell className="h-3.5 w-3.5" />
        )}
        <span>{hasReminder ? 'Reminder Set' : 'Remind Me'}</span>
        {count > 0 && (
          <span className="ml-0.5 rounded-full bg-black/10 dark:bg-white/10 px-1.5 py-0.2 text-[10px] font-mono">
            {count}
          </span>
        )}
      </button>

      {errorMsg && (
        <span className="text-[11px] text-rose-500 font-medium pl-1">
          {errorMsg}
        </span>
      )}
    </div>
  );
}

export default EventReminderButton;
