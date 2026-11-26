'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Layers,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  EventRegistrationTrack,
  RegistrationField,
  RegistrationFieldType,
  TrackCategory,
} from '../../types/portal';
import {
  createTrackFromTemplate,
  REGISTRATION_FIELD_TYPE_OPTIONS,
  TRACK_CATEGORY_CATALOG,
  validateTrackForBuilder,
} from '../../utils/eventTracks';
import { QrCodeSvg, StatusBadge, StudioButton } from '../ui/Primitives';

export interface TrackRegistrationBuilderProps {
  registrationMode: 'single' | 'multi';
  onModeChange: (mode: 'single' | 'multi') => void;
  tracks: EventRegistrationTrack[];
  onTracksChange: (next: EventRegistrationTrack[]) => void;
  defaultUpiId: string;
  eventTitle: string;
  registeredCountByTrackId: Record<string, number>;
  // Legacy single-track state props (used when registrationMode === 'single')
  singleIsPaid: boolean;
  singleFeeInr: number;
  singleUpiId: string;
  onSinglePricingChange: (patch: { isPaid?: boolean; feeInr?: number; upiId?: string }) => void;
}

export const TrackRegistrationBuilder: React.FC<TrackRegistrationBuilderProps> = ({
  registrationMode,
  onModeChange,
  tracks,
  onTracksChange,
  defaultUpiId,
  eventTitle,
  registeredCountByTrackId,
  singleIsPaid,
  singleFeeInr,
  singleUpiId,
  onSinglePricingChange,
}) => {
  const [expandedTrackId, setExpandedTrackId] = useState<string | null>(tracks[0]?.id ?? null);
  const [previewTrackId, setPreviewTrackId] = useState<string | null>(null);
  const [customCategoryName, setCustomCategoryName] = useState('');

  const updateTrack = (trackId: string, updater: (t: EventRegistrationTrack) => EventRegistrationTrack) => {
    onTracksChange(tracks.map((t) => (t.id === trackId ? updater(t) : t)));
  };

  const toggleCategoryPreset = (category: TrackCategory) => {
    if (category === 'custom') {
      const created = createTrackFromTemplate('custom', {
        existingIds: tracks.map((t) => t.id),
        defaultUpiId,
        customName: customCategoryName.trim() || `Custom Category ${tracks.length + 1}`,
      });
      onTracksChange([...tracks, created]);
      setExpandedTrackId(created.id);
      setCustomCategoryName('');
      return;
    }

    const existing = tracks.find((t) => t.category === category);
    if (existing) {
      const regCount = registeredCountByTrackId[existing.id] ?? 0;
      if (regCount > 0) {
        // Never destructively wipe a track that already has registrations; disable it instead
        updateTrack(existing.id, (t) => ({ ...t, enabled: !t.enabled }));
        return;
      }
      const remaining = tracks.filter((t) => t.id !== existing.id);
      onTracksChange(remaining);
      if (expandedTrackId === existing.id) {
        setExpandedTrackId(remaining[0]?.id ?? null);
      }
      return;
    }

    const created = createTrackFromTemplate(category, {
      existingIds: tracks.map((t) => t.id),
      defaultUpiId,
    });
    onTracksChange([...tracks, created]);
    setExpandedTrackId(created.id);
  };

  const moveTrack = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= tracks.length) return;
    const next = [...tracks];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onTracksChange(next);
  };

  const removeTrack = (trackId: string) => {
    const regCount = registeredCountByTrackId[trackId] ?? 0;
    if (regCount > 0) {
      updateTrack(trackId, (t) => ({ ...t, enabled: false }));
      return;
    }
    const next = tracks.filter((t) => t.id !== trackId);
    onTracksChange(next);
    if (expandedTrackId === trackId) {
      setExpandedTrackId(next[0]?.id ?? null);
    }
  };

  const applyTemplateToTrack = (trackId: string, templateCategory: TrackCategory) => {
    const template = createTrackFromTemplate(templateCategory, { defaultUpiId });
    updateTrack(trackId, (t) => ({
      ...t,
      description: template.description,
      instructions: template.instructions,
      eligibility: template.eligibility,
      registrationFields: template.registrationFields,
    }));
  };

  const addFieldToTrack = (trackId: string, type: RegistrationFieldType = 'text') => {
    const newField: RegistrationField = {
      id: `fld-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      label:
        type === 'file'
          ? 'Supporting Document Upload'
          : type === 'team_members'
            ? 'Team Members'
            : type === 'institution'
              ? 'Institution / Organization'
              : 'Custom Question',
      type,
      required: false,
      visible: true,
      placeholder: '',
      options:
        type === 'select' || type === 'radio' || type === 'multiselect'
          ? ['Option 1', 'Option 2']
          : undefined,
      accept: type === 'file' ? '.pdf,.ppt,.pptx,.doc,.docx,.jpg,.png' : undefined,
    };
    updateTrack(trackId, (t) => ({
      ...t,
      registrationFields: [...t.registrationFields, newField],
    }));
  };

  const updateField = (
    trackId: string,
    fieldId: string,
    patch: Partial<RegistrationField>
  ) => {
    updateTrack(trackId, (t) => ({
      ...t,
      registrationFields: t.registrationFields.map((f) =>
        f.id === fieldId ? { ...f, ...patch } : f
      ),
    }));
  };

  const moveField = (trackId: string, fieldIdx: number, direction: -1 | 1) => {
    updateTrack(trackId, (t) => {
      const target = fieldIdx + direction;
      if (target < 0 || target >= t.registrationFields.length) return t;
      const next = [...t.registrationFields];
      const [item] = next.splice(fieldIdx, 1);
      next.splice(target, 0, item);
      return { ...t, registrationFields: next };
    });
  };

  const removeField = (trackId: string, fieldId: string) => {
    updateTrack(trackId, (t) => ({
      ...t,
      registrationFields: t.registrationFields.filter((f) => f.id !== fieldId),
    }));
  };

  return (
    <div className="space-y-5">
      {/* Mode Switcher */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onModeChange('single')}
          className={`p-4 rounded-[9px] border text-left transition-colors cursor-pointer ${
            registrationMode === 'single'
              ? 'border-[#C01E30] bg-[var(--accent-soft)]'
              : 'border-[var(--border-hairline)] bg-[var(--surface-subtle)] hover:border-[var(--border-strong)]'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-display font-semibold text-[var(--color-2-mood)]">
              Single-Track Registration
            </span>
            {registrationMode === 'single' && <StatusBadge label="Active" tone="crimson" />}
          </div>
          <p className="text-xs text-[var(--ink-muted)] mt-1 leading-relaxed">
            One unified registration form and single pricing rule. Ideal for simple free workshops,
            guest talks, or uniform hackathons.
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            onModeChange('multi');
            if (tracks.length === 0) {
              const initial = [
                createTrackFromTemplate('attendee', { defaultUpiId }),
                createTrackFromTemplate('startup', {
                  existingIds: ['trk-attendee'],
                  defaultUpiId,
                }),
              ];
              onTracksChange(initial);
              setExpandedTrackId(initial[0].id);
            }
          }}
          className={`p-4 rounded-[9px] border text-left transition-colors cursor-pointer ${
            registrationMode === 'multi'
              ? 'border-[#C01E30] bg-[var(--accent-soft)]'
              : 'border-[var(--border-hairline)] bg-[var(--surface-subtle)] hover:border-[var(--border-strong)]'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-display font-semibold text-[var(--color-2-mood)] inline-flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-[#C01E30]" />
              <span>Multi-Track Categories</span>
            </span>
            {registrationMode === 'multi' && (
              <StatusBadge label={`${tracks.filter((t) => t.enabled).length} Active`} tone="crimson" />
            )}
          </div>
          <p className="text-xs text-[var(--ink-muted)] mt-1 leading-relaxed">
            Configure distinct participant groups (Students, Exhibitors, Research Scholars, Startups,
            Guests) with independent pricing, capacity, and custom forms.
          </p>
        </button>
      </div>

      {/* SINGLE-TRACK PRICING */}
      {registrationMode === 'single' && (
        <div className="p-4 rounded-[9px] border border-[var(--border-hairline)] bg-[var(--surface-subtle)] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-[var(--color-2-mood)]">
                Event-Wide Ticketing &amp; Fee
              </p>
              <p className="text-[11px] text-[var(--ink-muted)] mt-0.5">
                All registrants follow one standard entry flow.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSinglePricingChange({ isPaid: false, feeInr: 0 })}
                className={`px-3 py-1.5 rounded-[7px] text-xs font-medium border cursor-pointer ${
                  !singleIsPaid
                    ? 'bg-[#030405] dark:bg-[#F1F0ED] text-white dark:text-[#101011] border-[#030405] dark:border-[#F1F0ED]'
                    : 'bg-[var(--surface)] text-[var(--ink-secondary)] border-[var(--border-hairline)]'
                }`}
              >
                Free Event
              </button>
              <button
                type="button"
                onClick={() =>
                  onSinglePricingChange({ isPaid: true, feeInr: singleFeeInr > 0 ? singleFeeInr : 299 })
                }
                className={`px-3 py-1.5 rounded-[7px] text-xs font-medium border cursor-pointer ${
                  singleIsPaid
                    ? 'bg-[#C01E30] text-white border-[#C01E30]'
                    : 'bg-[var(--surface)] text-[var(--ink-secondary)] border-[var(--border-hairline)]'
                }`}
              >
                Paid UPI Event
              </button>
            </div>
          </div>

          {singleIsPaid && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pt-2 border-t border-[var(--border-hairline)]">
              <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--ink-secondary)] mb-1">
                    Registration Fee (INR) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={singleFeeInr}
                    onChange={(e) => onSinglePricingChange({ feeInr: Math.max(0, Number(e.target.value)) })}
                    className="studio-input font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--ink-secondary)] mb-1">
                    Official EDC UPI ID *
                  </label>
                  <input
                    type="text"
                    value={singleUpiId}
                    onChange={(e) => onSinglePricingChange({ upiId: e.target.value })}
                    placeholder="edcaitr.events@icici"
                    className="studio-input font-mono"
                  />
                </div>
              </div>
              <div className="md:col-span-5 flex items-center gap-3 p-3 rounded-[9px] bg-[var(--surface)] border border-[var(--border-hairline)]">
                <QrCodeSvg
                  value={`upi://pay?pa=${singleUpiId || 'edcaitr@icici'}&pn=EDC%20AITR&am=${singleFeeInr}&cu=INR`}
                  size={84}
                />
                <div className="text-[11px] text-[var(--ink-muted)] space-y-0.5 min-w-0">
                  <p className="font-semibold text-[var(--color-2-mood)]">Live UPI Preview</p>
                  <p className="font-mono text-[#C01E30] dark:text-[#E67C87] font-semibold">₹{singleFeeInr}</p>
                  <p className="font-mono truncate">{singleUpiId || 'Set UPI ID'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MULTI-TRACK BUILDER */}
      {registrationMode === 'multi' && (
        <div className="space-y-5">
          {/* Category Selection Matrix */}
          <div className="p-4 rounded-[9px] border border-[var(--border-hairline)] bg-[var(--surface-subtle)] space-y-3">
            <div>
              <p className="text-xs font-semibold text-[var(--color-2-mood)]">
                Select Participant Categories (Tracks)
              </p>
              <p className="text-[11px] text-[var(--ink-muted)] mt-0.5">
                Check the participant groups invited to this event. Each category gets its own pricing,
                capacity, eligibility, and registration form.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {TRACK_CATEGORY_CATALOG.filter((c) => c.category !== 'custom').map((cat) => {
                const matched = tracks.find((t) => t.category === cat.category);
                const checked = Boolean(matched && matched.enabled);
                return (
                  <button
                    key={cat.category}
                    type="button"
                    onClick={() => toggleCategoryPreset(cat.category)}
                    className={`p-3 rounded-[8px] border text-left transition-colors cursor-pointer flex items-start gap-2.5 ${
                      checked
                        ? 'bg-[var(--surface)] border-[#C01E30]'
                        : 'bg-[var(--surface)]/70 border-[var(--border-hairline)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <span
                      className={`mt-0.5 h-4 w-4 rounded-[4px] border flex items-center justify-center shrink-0 ${
                        checked
                          ? 'bg-[#C01E30] border-[#C01E30] text-white'
                          : 'border-[var(--border-strong)] bg-[var(--surface)]'
                      }`}
                    >
                      {checked && <Check className="h-3 w-3" strokeWidth={2.4} />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[var(--color-2-mood)]">{cat.label}</p>
                      <p className="text-[11px] text-[var(--ink-muted)] mt-0.5 line-clamp-2">
                        {cat.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Add Custom Category Bar */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-[var(--border-hairline)]">
              <input
                type="text"
                value={customCategoryName}
                onChange={(e) => setCustomCategoryName(e.target.value)}
                placeholder="Add custom category (e.g. Investor Delegate, Campus Ambassador, Alumni Mentor)"
                className="studio-input text-xs flex-1"
              />
              <StudioButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => toggleCategoryPreset('custom')}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Custom Category</span>
              </StudioButton>
            </div>
          </div>

          {/* Expandable Per-Track Configuration Panels */}
          {tracks.length === 0 ? (
            <div className="p-6 rounded-[9px] border border-dashed border-[var(--border-strong)] text-center text-xs text-[var(--ink-muted)]">
              Select at least one participant category above to configure its pricing and registration form.
            </div>
          ) : (
            <div className="space-y-3">
              {tracks.map((track, trackIdx) => {
                const regCount = registeredCountByTrackId[track.id] ?? 0;
                const validation = validateTrackForBuilder(track, tracks, regCount);
                const isExpanded = expandedTrackId === track.id;
                const isPreviewing = previewTrackId === track.id;

                return (
                  <div
                    key={track.id}
                    className={`rounded-[10px] border transition-colors ${
                      validation.status === 'Needs configuration'
                        ? 'border-amber-500/60 bg-[var(--surface)]'
                        : 'border-[var(--border-hairline)] bg-[var(--surface)]'
                    }`}
                  >
                    {/* Panel Header */}
                    <div className="p-4 flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setExpandedTrackId(isExpanded ? null : track.id)}
                        className="flex items-center gap-3 text-left flex-1 min-w-[200px] cursor-pointer"
                      >
                        <div className="h-7 w-7 rounded-[6px] bg-[var(--surface-subtle)] border border-[var(--border-hairline)] flex items-center justify-center font-mono text-xs font-semibold text-[var(--color-2-mood)] shrink-0">
                          {trackIdx + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-display font-semibold text-[var(--color-2-mood)]">
                              {track.name || 'Untitled Category'}
                            </span>
                            <StatusBadge label={validation.status} tone={validation.tone} />
                            <StatusBadge
                              label={
                                track.pricing.type === 'paid'
                                  ? `₹${track.pricing.amountInr}`
                                  : 'Free'
                              }
                              tone={track.pricing.type === 'paid' ? 'crimson' : 'neutral'}
                            />
                          </div>
                          <p className="text-[11px] text-[var(--ink-muted)] mt-0.5">
                            {track.capacity === null
                              ? `${regCount} registered · Unlimited capacity`
                              : `${regCount} / ${track.capacity} seats`}
                            {' · '}
                            {track.registrationFields.filter((f) => f.visible !== false).length} form fields
                          </p>
                        </div>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => moveTrack(trackIdx, -1)}
                          disabled={trackIdx === 0}
                          title="Move track up"
                          className="h-8 w-8 rounded-[7px] border border-[var(--border-hairline)] flex items-center justify-center text-[var(--ink-secondary)] hover:bg-[var(--surface-subtle)] disabled:opacity-35 cursor-pointer"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveTrack(trackIdx, 1)}
                          disabled={trackIdx === tracks.length - 1}
                          title="Move track down"
                          className="h-8 w-8 rounded-[7px] border border-[var(--border-hairline)] flex items-center justify-center text-[var(--ink-secondary)] hover:bg-[var(--surface-subtle)] disabled:opacity-35 cursor-pointer"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateTrack(track.id, (t) => ({ ...t, enabled: !t.enabled }))
                          }
                          className={`px-2.5 h-8 rounded-[7px] border text-[11px] font-medium cursor-pointer ${
                            track.enabled
                              ? 'border-[var(--border-hairline)] text-[var(--ink-secondary)] hover:bg-[var(--surface-subtle)]'
                              : 'border-amber-500/50 bg-[#FFFBEB] dark:bg-amber-950/50 text-[#B45309] dark:text-amber-300'
                          }`}
                        >
                          {track.enabled ? 'Enabled' : 'Disabled'}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeTrack(track.id)}
                          title={
                            regCount > 0
                              ? 'Has existing registrations — disables category safely'
                              : 'Remove category'
                          }
                          className="h-8 w-8 rounded-[7px] border border-[var(--border-hairline)] flex items-center justify-center text-[#C01E30] dark:text-[#E67C87] hover:bg-[var(--accent-soft)] cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpandedTrackId(isExpanded ? null : track.id)}
                          className="h-8 w-8 rounded-[7px] border border-[var(--border-hairline)] flex items-center justify-center text-[var(--ink-secondary)] hover:bg-[var(--surface-subtle)] cursor-pointer"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Validation Issues Banner */}
                    {validation.issues.length > 0 && (
                      <div className="mx-4 mb-3 p-2.5 rounded-[7px] bg-[#FFFBEB] dark:bg-amber-950/40 border border-[#FDE68A] dark:border-amber-800/70 space-y-1">
                        {validation.issues.map((issue) => (
                          <div
                            key={issue}
                            className="flex items-center gap-1.5 text-xs text-[#B45309] dark:text-amber-300"
                          >
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            <span>{issue}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Expanded Track Editor */}
                    {isExpanded && (
                      <div className="px-4 pb-5 pt-4 border-t border-[var(--border-hairline)] space-y-5">
                        {/* Section A: Identity & Eligibility */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div>
                            <label className="block text-xs font-medium text-[var(--ink-secondary)] mb-1">
                              Category Name *
                            </label>
                            <input
                              type="text"
                              value={track.name}
                              onChange={(e) =>
                                updateTrack(track.id, (t) => ({ ...t, name: e.target.value }))
                              }
                              placeholder="e.g. Startup / Pitch Applicant"
                              className="studio-input text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-[var(--ink-secondary)] mb-1">
                              Eligibility Summary
                            </label>
                            <input
                              type="text"
                              value={track.eligibility}
                              onChange={(e) =>
                                updateTrack(track.id, (t) => ({ ...t, eligibility: e.target.value }))
                              }
                              placeholder="Who can apply under this track?"
                              className="studio-input text-xs"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-[var(--ink-secondary)] mb-1">
                              Public Track Description
                            </label>
                            <textarea
                              rows={2}
                              value={track.description}
                              onChange={(e) =>
                                updateTrack(track.id, (t) => ({ ...t, description: e.target.value }))
                              }
                              className="studio-input text-xs"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-[var(--ink-secondary)] mb-1">
                              Participant Instructions (Shown during registration)
                            </label>
                            <input
                              type="text"
                              value={track.instructions ?? ''}
                              onChange={(e) =>
                                updateTrack(track.id, (t) => ({ ...t, instructions: e.target.value }))
                              }
                              placeholder="e.g. Bring valid ID card or prepare a 7-minute pitch deck"
                              className="studio-input text-xs"
                            />
                          </div>
                        </div>

                        {/* Section B: Independent Pricing & Capacity & Window */}
                        <div className="p-4 rounded-[9px] bg-[var(--surface-subtle)] border border-[var(--border-hairline)] space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-[var(--color-2-mood)]">
                              Pricing, Capacity &amp; Schedule Window
                            </p>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  updateTrack(track.id, (t) => ({
                                    ...t,
                                    pricing: { ...t.pricing, type: 'free', amountInr: 0 },
                                  }))
                                }
                                className={`px-2.5 py-1 rounded-[6px] text-xs font-medium border cursor-pointer ${
                                  track.pricing.type === 'free'
                                    ? 'bg-[#030405] dark:bg-[#F1F0ED] text-white dark:text-[#101011] border-[#030405] dark:border-[#F1F0ED]'
                                    : 'bg-[var(--surface)] text-[var(--ink-secondary)] border-[var(--border-hairline)]'
                                }`}
                              >
                                Free Track
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  updateTrack(track.id, (t) => ({
                                    ...t,
                                    pricing: {
                                      ...t.pricing,
                                      type: 'paid',
                                      amountInr: t.pricing.amountInr > 0 ? t.pricing.amountInr : 299,
                                      upiId: t.pricing.upiId || defaultUpiId || 'edcaitr.events@icici',
                                    },
                                  }))
                                }
                                className={`px-2.5 py-1 rounded-[6px] text-xs font-medium border cursor-pointer ${
                                  track.pricing.type === 'paid'
                                    ? 'bg-[#C01E30] text-white border-[#C01E30]'
                                    : 'bg-[var(--surface)] text-[var(--ink-secondary)] border-[var(--border-hairline)]'
                                }`}
                              >
                                Paid Track
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {track.pricing.type === 'paid' && (
                              <>
                                <div>
                                  <label className="block text-[11px] font-medium text-[var(--ink-secondary)] mb-1">
                                    Fee (INR) *
                                  </label>
                                  <input
                                    type="number"
                                    min={1}
                                    value={track.pricing.amountInr}
                                    onChange={(e) =>
                                      updateTrack(track.id, (t) => ({
                                        ...t,
                                        pricing: {
                                          ...t.pricing,
                                          amountInr: Math.max(0, Number(e.target.value)),
                                        },
                                      }))
                                    }
                                    className="studio-input text-xs font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-medium text-[var(--ink-secondary)] mb-1">
                                    UPI ID *
                                  </label>
                                  <input
                                    type="text"
                                    value={track.pricing.upiId ?? ''}
                                    onChange={(e) =>
                                      updateTrack(track.id, (t) => ({
                                        ...t,
                                        pricing: { ...t.pricing, upiId: e.target.value },
                                      }))
                                    }
                                    placeholder="edcaitr.events@icici"
                                    className="studio-input text-xs font-mono"
                                  />
                                </div>
                              </>
                            )}
                            <div>
                              <label className="block text-[11px] font-medium text-[var(--ink-secondary)] mb-1">
                                Category Capacity (blank = unlimited)
                              </label>
                              <input
                                type="number"
                                min={1}
                                value={track.capacity ?? ''}
                                onChange={(e) =>
                                  updateTrack(track.id, (t) => ({
                                    ...t,
                                    capacity: e.target.value === '' ? null : Number(e.target.value),
                                  }))
                                }
                                placeholder="Unlimited"
                                className="studio-input text-xs font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-[var(--ink-secondary)] mb-1">
                                Fee / Pass Note
                              </label>
                              <input
                                type="text"
                                value={track.pricing.feeDescription ?? ''}
                                onChange={(e) =>
                                  updateTrack(track.id, (t) => ({
                                    ...t,
                                    pricing: { ...t.pricing, feeDescription: e.target.value },
                                  }))
                                }
                                placeholder="What is included in this pass?"
                                className="studio-input text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-[var(--ink-secondary)] mb-1">
                                Opens On (Optional)
                              </label>
                              <input
                                type="date"
                                value={track.registrationOpensAt ?? ''}
                                onChange={(e) =>
                                  updateTrack(track.id, (t) => ({
                                    ...t,
                                    registrationOpensAt: e.target.value || undefined,
                                  }))
                                }
                                className="studio-input text-xs font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-[var(--ink-secondary)] mb-1">
                                Closes On (Optional)
                              </label>
                              <input
                                type="date"
                                value={track.registrationClosesAt ?? ''}
                                onChange={(e) =>
                                  updateTrack(track.id, (t) => ({
                                    ...t,
                                    registrationClosesAt: e.target.value || undefined,
                                  }))
                                }
                                className="studio-input text-xs font-mono"
                              />
                            </div>
                            {track.pricing.type === 'paid' && (
                              <>
                                <div>
                                  <label className="block text-[11px] font-medium text-[var(--ink-secondary)] mb-1">
                                    Early-Bird Fee (Optional)
                                  </label>
                                  <input
                                    type="number"
                                    min={0}
                                    value={track.pricing.earlyBirdAmountInr ?? ''}
                                    onChange={(e) =>
                                      updateTrack(track.id, (t) => ({
                                        ...t,
                                        pricing: {
                                          ...t.pricing,
                                          earlyBirdAmountInr:
                                            e.target.value === '' ? undefined : Number(e.target.value),
                                        },
                                      }))
                                    }
                                    placeholder="None"
                                    className="studio-input text-xs font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-medium text-[var(--ink-secondary)] mb-1">
                                    Early-Bird Deadline
                                  </label>
                                  <input
                                    type="date"
                                    value={track.pricing.earlyBirdDeadline ?? ''}
                                    onChange={(e) =>
                                      updateTrack(track.id, (t) => ({
                                        ...t,
                                        pricing: {
                                          ...t.pricing,
                                          earlyBirdDeadline: e.target.value || undefined,
                                        },
                                      }))
                                    }
                                    className="studio-input text-xs font-mono"
                                  />
                                </div>
                              </>
                            )}
                          </div>

                          {track.pricing.type === 'paid' && track.pricing.amountInr > 0 && (
                            <div className="flex items-center gap-3 p-3 rounded-[8px] bg-[var(--surface)] border border-[var(--border-hairline)]">
                              <QrCodeSvg
                                value={`upi://pay?pa=${track.pricing.upiId || defaultUpiId}&pn=${encodeURIComponent(
                                  `${eventTitle || 'EDC AITR'} - ${track.name}`
                                )}&am=${track.pricing.amountInr}&cu=INR`}
                                size={74}
                              />
                              <div className="text-[11px] text-[var(--ink-muted)] space-y-0.5">
                                <p className="font-semibold text-[var(--color-2-mood)]">
                                  Category-Specific UPI QR · ₹{track.pricing.amountInr}
                                </p>
                                <p className="font-mono text-[var(--ink-secondary)]">
                                  {track.pricing.upiId || 'Enter UPI ID'}
                                </p>
                                <p>Applicants in this category must submit a UTR for RD verification.</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Section C: Independent Registration Form Builder */}
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="text-xs font-semibold text-[var(--color-2-mood)]">
                                Category Registration Form Fields
                              </p>
                              <p className="text-[11px] text-[var(--ink-muted)]">
                                Standard identity fields (Full Name, Email, Enrollment/ID) are always collected automatically.
                                Add category-specific fields below.
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <select
                                defaultValue=""
                                onChange={(e) => {
                                  if (!e.target.value) return;
                                  applyTemplateToTrack(track.id, e.target.value as TrackCategory);
                                  e.target.value = '';
                                }}
                                className="studio-input text-xs w-auto py-1.5"
                                aria-label="Load preset template"
                              >
                                <option value="">Load Preset Template…</option>
                                <option value="startup">Template: Startup / Pitch Applicant</option>
                                <option value="student_exhibitor">Template: Student Exhibitor</option>
                                <option value="research_scholar">Template: Research Scholar</option>
                                <option value="attendee">Template: General Attendee</option>
                                <option value="speaker">Template: Speaker / Guest</option>
                              </select>
                              <StudioButton
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() =>
                                  setPreviewTrackId(isPreviewing ? null : track.id)
                                }
                              >
                                {isPreviewing ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                <span>{isPreviewing ? 'Hide Preview' : 'Preview Form'}</span>
                              </StudioButton>
                            </div>
                          </div>

                          {/* Field List */}
                          <div className="space-y-2">
                            {track.registrationFields.map((field, fIdx) => {
                              const typeMeta = REGISTRATION_FIELD_TYPE_OPTIONS.find(
                                (o) => o.type === field.type
                              );
                              return (
                                <div
                                  key={field.id}
                                  className={`p-3 rounded-[8px] border space-y-2.5 ${
                                    field.visible === false
                                      ? 'opacity-60 border-dashed border-[var(--border-hairline)] bg-[var(--surface-subtle)]'
                                      : 'border-[var(--border-hairline)] bg-[var(--surface-subtle)]'
                                  }`}
                                >
                                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                                    <div className="sm:col-span-5">
                                      <input
                                        type="text"
                                        value={field.label}
                                        onChange={(e) =>
                                          updateField(track.id, field.id, { label: e.target.value })
                                        }
                                        placeholder="Field Label"
                                        className="studio-input text-xs"
                                      />
                                    </div>
                                    <div className="sm:col-span-4">
                                      <select
                                        value={field.type}
                                        onChange={(e) => {
                                          const nextType = e.target.value as RegistrationFieldType;
                                          const needsOpts =
                                            nextType === 'select' ||
                                            nextType === 'radio' ||
                                            nextType === 'multiselect';
                                          updateField(track.id, field.id, {
                                            type: nextType,
                                            options: needsOpts
                                              ? field.options?.length
                                                ? field.options
                                                : ['Option 1', 'Option 2']
                                              : undefined,
                                          });
                                        }}
                                        className="studio-input text-xs"
                                      >
                                        {REGISTRATION_FIELD_TYPE_OPTIONS.map((opt) => (
                                          <option key={opt.type} value={opt.type}>
                                            {opt.label}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="sm:col-span-3 flex items-center justify-end gap-1.5">
                                      <label className="inline-flex items-center gap-1 text-[11px] text-[var(--ink-secondary)] cursor-pointer select-none mr-1">
                                        <input
                                          type="checkbox"
                                          checked={field.required}
                                          onChange={(e) =>
                                            updateField(track.id, field.id, {
                                              required: e.target.checked,
                                            })
                                          }
                                          className="accent-[#C01E30]"
                                        />
                                        <span>Req</span>
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() => moveField(track.id, fIdx, -1)}
                                        disabled={fIdx === 0}
                                        className="h-7 w-7 rounded-[6px] border border-[var(--border-hairline)] flex items-center justify-center text-[var(--ink-secondary)] disabled:opacity-35 cursor-pointer"
                                        title="Move field up"
                                      >
                                        <ArrowUp className="h-3 w-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => moveField(track.id, fIdx, 1)}
                                        disabled={fIdx === track.registrationFields.length - 1}
                                        className="h-7 w-7 rounded-[6px] border border-[var(--border-hairline)] flex items-center justify-center text-[var(--ink-secondary)] disabled:opacity-35 cursor-pointer"
                                        title="Move field down"
                                      >
                                        <ArrowDown className="h-3 w-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          updateField(track.id, field.id, {
                                            visible: field.visible === false ? true : false,
                                          })
                                        }
                                        className="h-7 w-7 rounded-[6px] border border-[var(--border-hairline)] flex items-center justify-center text-[var(--ink-secondary)] cursor-pointer"
                                        title={field.visible === false ? 'Show field' : 'Hide field'}
                                      >
                                        {field.visible === false ? (
                                          <EyeOff className="h-3 w-3" />
                                        ) : (
                                          <Eye className="h-3 w-3" />
                                        )}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => removeField(track.id, field.id)}
                                        className="h-7 w-7 rounded-[6px] border border-[var(--border-hairline)] flex items-center justify-center text-[#C01E30] cursor-pointer"
                                        title="Remove field"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <input
                                      type="text"
                                      value={field.placeholder ?? ''}
                                      onChange={(e) =>
                                        updateField(track.id, field.id, {
                                          placeholder: e.target.value,
                                        })
                                      }
                                      placeholder="Placeholder or helper hint (optional)"
                                      className="studio-input text-[11px]"
                                    />
                                    {typeMeta?.supportsOptions ? (
                                      <input
                                        type="text"
                                        value={(field.options ?? []).join(', ')}
                                        onChange={(e) =>
                                          updateField(track.id, field.id, {
                                            options: e.target.value
                                              .split(',')
                                              .map((s) => s.trim())
                                              .filter(Boolean),
                                          })
                                        }
                                        placeholder="Comma-separated options (e.g. Idea, MVP, Revenue)"
                                        className="studio-input text-[11px]"
                                      />
                                    ) : (
                                      <input
                                        type="text"
                                        value={field.description ?? ''}
                                        onChange={(e) =>
                                          updateField(track.id, field.id, {
                                            description: e.target.value,
                                          })
                                        }
                                        placeholder="Helper description below field (optional)"
                                        className="studio-input text-[11px]"
                                      />
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <StudioButton
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => addFieldToTrack(track.id, 'text')}
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Add Text Field</span>
                            </StudioButton>
                            <StudioButton
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => addFieldToTrack(track.id, 'select')}
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Add Dropdown</span>
                            </StudioButton>
                            <StudioButton
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => addFieldToTrack(track.id, 'file')}
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Add File Upload</span>
                            </StudioButton>
                            <StudioButton
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => addFieldToTrack(track.id, 'team_members')}
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Add Team Roster</span>
                            </StudioButton>
                          </div>

                          {/* Live Form Preview */}
                          {isPreviewing && (
                            <div className="p-4 rounded-[9px] border border-[#C01E30]/35 bg-[var(--surface-subtle)] space-y-3">
                              <div className="flex items-center justify-between gap-2 pb-2 border-b border-[var(--border-hairline)]">
                                <span className="text-xs font-semibold text-[var(--color-2-mood)] inline-flex items-center gap-1.5">
                                  <Sparkles className="h-3.5 w-3.5 text-[#C01E30]" />
                                  <span>Live Applicant Preview · {track.name}</span>
                                </span>
                                <StatusBadge
                                  label={
                                    track.pricing.type === 'paid'
                                      ? `₹${track.pricing.amountInr} UPI`
                                      : 'Free Pass'
                                  }
                                  tone={track.pricing.type === 'paid' ? 'crimson' : 'green'}
                                />
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 opacity-90 pointer-events-none">
                                <div>
                                  <span className="block text-[11px] font-medium text-[var(--ink-secondary)] mb-1">
                                    Full Name *
                                  </span>
                                  <div className="studio-input text-xs text-[var(--ink-muted)]">
                                    Applicant full name
                                  </div>
                                </div>
                                <div>
                                  <span className="block text-[11px] font-medium text-[var(--ink-secondary)] mb-1">
                                    Email Address *
                                  </span>
                                  <div className="studio-input text-xs text-[var(--ink-muted)]">
                                    applicant@institution.edu
                                  </div>
                                </div>
                                {track.registrationFields
                                  .filter((f) => f.visible !== false)
                                  .map((field) => (
                                    <div
                                      key={field.id}
                                      className={
                                        field.type === 'textarea' || field.type === 'team_members'
                                          ? 'sm:col-span-2'
                                          : ''
                                      }
                                    >
                                      <span className="block text-[11px] font-medium text-[var(--ink-secondary)] mb-1">
                                        {field.label} {field.required ? '*' : ''}
                                      </span>
                                      <div className="studio-input text-xs text-[var(--ink-muted)]">
                                        {field.type === 'file'
                                          ? 'Choose file (PDF/PPTX/DOCX · IndexedDB)'
                                          : field.type === 'team_members'
                                            ? '+ Add team member rows (Name, Role, Email)'
                                            : field.options?.length
                                              ? field.options.join(' / ')
                                              : field.placeholder || `Enter ${field.label.toLowerCase()}`}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
