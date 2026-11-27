'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  ExternalLink,
  Flame,
  LayoutGrid,
  List,
  Loader2,
  MapPin,
  Plus,
  Sliders,
  UserCheck,
  X,
  XCircle,
} from 'lucide-react';

export interface CalendarEvent {
  id: string;
  title: string;
  slug: string;
  starts_at: string | null;
  ends_at: string | null;
  venue: string | null;
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'archived' | 'cancelled';
  planning_stage?: string;
  planning_progress?: number;
  cancellation_reason?: string | null;
}

interface Props {
  userRole: string;
  userDomain: string | null;
}

const STAGE_CONFIG: Record<
  string,
  { label: string; badgeClass: string; color: string }
> = {
  concept: {
    label: 'Concept & Scoping',
    badgeClass: 'border-zinc-500/20 bg-zinc-500/10 text-zinc-600 dark:text-zinc-400',
    color: '#71717A',
  },
  speaker_curation: {
    label: 'Speaker & Jury Curation',
    badgeClass: 'border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400',
    color: '#3B82F6',
  },
  permissions_venue: {
    label: 'Venue & Institutional Approvals',
    badgeClass: 'border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-400',
    color: '#A855F7',
  },
  marketing_ready: {
    label: 'Marketing & Registrations Ready',
    badgeClass: 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    color: '#F59E0B',
  },
  live_ready: {
    label: 'Execution & Live Production',
    badgeClass: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    color: '#10B981',
  },
  concluded: {
    label: 'Concluded & Archived',
    badgeClass: 'border-zinc-500/20 bg-zinc-500/10 text-zinc-500',
    color: '#6B7280',
  },
  cancelled: {
    label: 'Cancelled / Rescheduled',
    badgeClass: 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400',
    color: '#E11D48',
  },
};

export function EventCalendar({ userRole, userDomain }: Props) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'calendar' | 'pipeline'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  // Modal / Drawer state for creating / editing
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  // Form fields
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formVenue, setFormVenue] = useState('Acropolis Main Auditorium, Indore');
  const [formStage, setFormStage] = useState('concept');
  const [formProgress, setFormProgress] = useState(15);
  const [formCancelReason, setFormCancelReason] = useState('');

  // Can this user schedule or update calendar progress?
  // Strictly permitted for Programs & Experiences coordinators, Advisors, and Director.
  const canManage =
    userRole === 'director' ||
    userRole === 'advisor' ||
    (userRole === 'core_team' && userDomain === 'programs_experiences');

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/workspace/events/calendar');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events ?? []);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;
    setBusy(true);
    setActionMsg(null);
    try {
      const res = await fetch('/api/workspace/events/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle.trim(),
          starts_at: formDate ? new Date(formDate).toISOString() : null,
          venue: formVenue.trim(),
          planning_stage: formStage,
          planning_progress: formProgress,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to schedule event.');

      setActionMsg({ text: 'Upcoming event added to calendar successfully!' });
      setIsCreating(false);
      setFormTitle('');
      setFormDate('');
      fetchEvents();
    } catch (err: unknown) {
      setActionMsg({
        text: err instanceof Error ? err.message : 'Scheduling failed.',
        isError: true,
      });
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    setBusy(true);
    setActionMsg(null);
    try {
      const res = await fetch('/api/workspace/events/calendar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: editingEvent.id,
          planning_stage: formStage,
          planning_progress: formProgress,
          cancellation_reason: formStage === 'cancelled' ? formCancelReason : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to update progress.');

      setActionMsg({ text: 'Planning status updated successfully!' });
      setEditingEvent(null);
      fetchEvents();
    } catch (err: unknown) {
      setActionMsg({
        text: err instanceof Error ? err.message : 'Update failed.',
        isError: true,
      });
    } finally {
      setBusy(false);
    }
  };

  const openEditModal = (ev: CalendarEvent) => {
    setEditingEvent(ev);
    setFormStage(ev.planning_stage ?? 'concept');
    setFormProgress(ev.planning_progress ?? 20);
    setFormCancelReason(ev.cancellation_reason ?? '');
    setActionMsg(null);
  };

  // Month navigation helpers
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  // Calendar Grid generation
  const monthData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Leading empty slots
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    // Month days
    for (let d = 1; d <= totalDays; d++) {
      const dayDate = new Date(year, month, d);
      const dayEvents = events.filter((e) => {
        if (!e.starts_at) return false;
        const evDate = new Date(e.starts_at);
        return (
          evDate.getFullYear() === year &&
          evDate.getMonth() === month &&
          evDate.getDate() === d
        );
      });
      days.push({ day: d, date: dayDate, events: dayEvents });
    }
    return days;
  }, [currentMonth, events]);

  const monthLabel = currentMonth.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Calendar Header Band */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card p-5 sm:p-6 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#C01E30]/20 bg-[#C01E30]/10 px-3 py-1 text-xs font-semibold text-[#C01E30] dark:text-[#E67C87] mb-2">
            <CalendarIcon className="h-3.5 w-3.5" />
            <span>Programs &amp; Experiences Calendar</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Ecosystem Event Pipeline &amp; Readiness
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 max-w-2xl">
            Live master calendar tracking institutional dates, run-of-show milestones, and planning readiness percentages across all three domains.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="inline-flex rounded-xl border border-border/60 bg-secondary/60 p-1 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-all cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Month</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('pipeline')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-all cursor-pointer ${
                viewMode === 'pipeline'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Pipeline Agenda</span>
            </button>
          </div>

          {/* Action Button: Only Programs & Experiences, Advisors, and Director can propose events */}
          {canManage && (
            <button
              type="button"
              onClick={() => {
                setIsCreating(true);
                setActionMsg(null);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#C01E30] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#9E1625] transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Schedule Event</span>
            </button>
          )}
        </div>
      </div>

      {actionMsg && (
        <div
          role="status"
          className={`flex items-center gap-2 rounded-xl border p-3.5 text-xs font-semibold ${
            actionMsg.isError
              ? 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400'
              : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          }`}
        >
          {actionMsg.isError ? (
            <XCircle className="h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          )}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#C01E30]" />
          <p className="mt-3 text-xs text-muted-foreground">Loading calendar pipeline...</p>
        </div>
      ) : viewMode === 'calendar' ? (
        /* ════ MONTH VIEW ════ */
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-xs">
          {/* Month Toolbar */}
          <div className="flex items-center justify-between border-b border-border/40 px-6 py-4 bg-secondary/30">
            <h3 className="text-base sm:text-lg font-bold text-foreground">
              {monthLabel}
            </h3>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={prevMonth}
                aria-label="Previous month"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-background text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentMonth(new Date())}
                className="rounded-lg border border-border/60 bg-background px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={nextMonth}
                aria-label="Next month"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-background text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Weekday Header */}
          <div className="grid grid-cols-7 border-b border-border/40 bg-secondary/15 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-2.5">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-border/30 bg-background/50">
            {monthData.map((cell, idx) => {
              if (!cell) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="min-h-[105px] bg-secondary/10 p-2 opacity-50"
                  />
                );
              }

              const isToday =
                cell.date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={`day-${cell.day}`}
                  className={`min-h-[105px] p-2 transition-colors hover:bg-secondary/20 flex flex-col justify-between ${
                    isToday ? 'bg-[#C01E30]/5' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                        isToday
                          ? 'bg-[#C01E30] text-white'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {cell.day}
                    </span>
                    {cell.events.length > 0 && (
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {cell.events.length} ev
                      </span>
                    )}
                  </div>

                  {/* Day Events Stack */}
                  <div className="mt-1.5 space-y-1.5 flex-1 overflow-y-auto max-h-[85px]">
                    {cell.events.map((ev) => {
                      const stage = ev.planning_stage || 'concept';
                      const stageMeta = STAGE_CONFIG[stage] || STAGE_CONFIG.concept;
                      const isCancelled = ev.status === 'cancelled' || stage === 'cancelled';

                      return (
                        <div
                          key={ev.id}
                          onClick={() => canManage && openEditModal(ev)}
                          className={`group rounded-lg border p-1.5 text-left transition-all ${
                            isCancelled
                              ? 'border-rose-500/20 bg-rose-500/10 opacity-75'
                              : 'border-border/60 bg-card hover:border-[#C01E30]/60'
                          } ${canManage ? 'cursor-pointer hover:shadow-xs' : ''}`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className={`truncate text-[11px] font-bold ${
                                isCancelled ? 'line-through text-rose-500' : 'text-foreground'
                              }`}
                            >
                              {ev.title}
                            </span>
                            {canManage && (
                              <Edit3 className="h-3 w-3 opacity-0 group-hover:opacity-100 text-muted-foreground shrink-0" />
                            )}
                          </div>

                          <div className="mt-1 flex items-center justify-between text-[10px]">
                            <span
                              className={`truncate font-semibold ${
                                isCancelled ? 'text-rose-500' : 'text-muted-foreground'
                              }`}
                            >
                              {isCancelled ? 'Cancelled' : `${ev.planning_progress || 0}% Ready`}
                            </span>
                            {!isCancelled && (
                              <div className="w-10 h-1.5 rounded-full bg-secondary overflow-hidden">
                                <div
                                  className="h-full bg-[#C01E30] rounded-full"
                                  style={{ width: `${ev.planning_progress || 0}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ════ PIPELINE AGENDA VIEW ════ */
        <div className="space-y-4">
          {events.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 bg-card p-12 text-center">
              <CalendarIcon className="mx-auto h-8 w-8 text-muted-foreground" />
              <h3 className="mt-3 text-sm font-bold text-foreground">No Events Scheduled</h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                Programs &amp; Experiences coordinators can schedule upcoming summits, hackathons, and founder conclaves.
              </p>
            </div>
          ) : (
            events.map((ev) => {
              const stage = ev.planning_stage || 'concept';
              const stageMeta = STAGE_CONFIG[stage] || STAGE_CONFIG.concept;
              const isCancelled = ev.status === 'cancelled' || stage === 'cancelled';
              const formattedDate = ev.starts_at
                ? new Date(ev.starts_at).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Date to be finalized';

              return (
                <article
                  key={ev.id}
                  className={`rounded-2xl border p-5 sm:p-6 transition-all bg-card ${
                    isCancelled
                      ? 'border-rose-500/30 bg-rose-500/[0.04]'
                      : 'border-border/60 hover:border-border'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2 max-w-xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${stageMeta.badgeClass}`}
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: stageMeta.color }}
                          />
                          <span>{stageMeta.label}</span>
                        </span>

                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5 text-[#C01E30]" />
                          <span>{formattedDate}</span>
                        </span>
                      </div>

                      <h3
                        className={`text-lg font-bold ${
                          isCancelled ? 'line-through text-muted-foreground' : 'text-foreground'
                        }`}
                      >
                        {ev.title}
                      </h3>

                      {ev.venue && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{ev.venue}</span>
                        </div>
                      )}

                      {/* Cancellation Notice Banner */}
                      {isCancelled && ev.cancellation_reason && (
                        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">
                          <strong className="block font-semibold">Official Notice:</strong>
                          <span>{ev.cancellation_reason}</span>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar & Actions */}
                    <div className="flex flex-col items-end gap-3 min-w-[200px]">
                      {!isCancelled && (
                        <div className="w-full space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-muted-foreground">Planning Readiness</span>
                            <span className="font-mono text-[#C01E30]">{ev.planning_progress || 0}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-secondary overflow-hidden border border-border/40">
                            <div
                              className="h-full bg-[#C01E30] rounded-full transition-all"
                              style={{ width: `${ev.planning_progress || 0}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => openEditModal(ev)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-secondary/60 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors cursor-pointer"
                          >
                            <Sliders className="h-3.5 w-3.5" />
                            <span>Update Progress</span>
                          </button>
                        )}

                        <Link
                          href={`/workspace/events/${ev.id}`}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:border-[#C01E30] transition-colors"
                        >
                          <span>Manage Workspace</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}

      {/* ════ SCHEDULE NEW EVENT MODAL ════ */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
              <h3 className="text-lg font-bold text-foreground">Schedule Upcoming Event</h3>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Event Title <span className="text-[#C01E30]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. PitchBiz 6.0 Investor Conclave"
                  className="w-full rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#C01E30] focus:ring-1 focus:ring-[#C01E30] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Tentative Start Date
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full rounded-xl border border-border/60 bg-background px-3.5 py-2 text-sm text-foreground focus:border-[#C01E30] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Auditorium / Venue
                  </label>
                  <input
                    type="text"
                    value={formVenue}
                    onChange={(e) => setFormVenue(e.target.value)}
                    className="w-full rounded-xl border border-border/60 bg-background px-3.5 py-2 text-sm text-foreground focus:border-[#C01E30] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Initial Stage
                </label>
                <select
                  value={formStage}
                  onChange={(e) => setFormStage(e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-background px-3.5 py-2 text-sm text-foreground focus:border-[#C01E30] focus:outline-none"
                >
                  <option value="concept">Concept &amp; Scoping</option>
                  <option value="speaker_curation">Speaker &amp; Jury Curation</option>
                  <option value="permissions_venue">Venue &amp; Institutional Approvals</option>
                  <option value="marketing_ready">Marketing &amp; Registrations Ready</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className="text-foreground">Initial Planning Readiness</span>
                  <span className="font-mono text-[#C01E30]">{formProgress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formProgress}
                  onChange={(e) => setFormProgress(Number(e.target.value))}
                  className="w-full accent-[#C01E30] cursor-pointer"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  disabled={busy}
                  className="rounded-xl border border-border/60 px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#C01E30] px-5 py-2 text-xs font-semibold text-white hover:bg-[#9E1625] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  <span>Schedule Event</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════ UPDATE PROGRESS & CANCELLATION MODAL ════ */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  Update Planning Progress
                </h3>
                <p className="text-xs text-muted-foreground truncate max-w-xs sm:max-w-md">
                  {editingEvent.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingEvent(null)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Planning Stage
                </label>
                <select
                  value={formStage}
                  onChange={(e) => setFormStage(e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-background px-3.5 py-2 text-sm text-foreground focus:border-[#C01E30] focus:outline-none"
                >
                  <option value="concept">Concept &amp; Scoping</option>
                  <option value="speaker_curation">Speaker &amp; Jury Curation</option>
                  <option value="permissions_venue">Venue &amp; Institutional Approvals</option>
                  <option value="marketing_ready">Marketing &amp; Registrations Ready</option>
                  <option value="live_ready">Live Production / Ongoing</option>
                  <option value="concluded">Concluded</option>
                  <option value="cancelled">Cancelled / Rescheduled</option>
                </select>
              </div>

              {formStage !== 'cancelled' ? (
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold mb-1">
                    <span className="text-foreground">Readiness Progress</span>
                    <span className="font-mono text-[#C01E30]">{formProgress}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formProgress}
                    onChange={(e) => setFormProgress(Number(e.target.value))}
                    className="w-full accent-[#C01E30] cursor-pointer"
                  />
                </div>
              ) : (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 space-y-2">
                  <label className="block text-xs font-bold text-rose-700 dark:text-rose-300">
                    Official Cancellation Reason <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-muted-foreground">
                    This notice will be publicly displayed on the event page instead of letting it 404. All delegates who set a reminder will receive an automated alert.
                  </p>
                  <textarea
                    rows={3}
                    required
                    value={formCancelReason}
                    onChange={(e) => setFormCancelReason(e.target.value)}
                    placeholder="State transparent rationale (e.g. Rescheduled due to semester examination calendar; revised dates to be announced)."
                    className="w-full rounded-xl border border-rose-500/30 bg-background px-3 py-2 text-xs text-foreground focus:border-rose-500 focus:outline-none resize-none"
                  />
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  disabled={busy}
                  className="rounded-xl border border-border/60 px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#C01E30] px-5 py-2 text-xs font-semibold text-white hover:bg-[#9E1625] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  <span>Save Updates</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default EventCalendar;
