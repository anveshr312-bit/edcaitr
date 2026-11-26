'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  FileText,
  Layers,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  EventItem,
  EventRegistrationTrack,
  Registration,
  RegistrationField,
  RegistrationFieldAnswerValue,
  RegistrationFieldResponse,
  TeamMemberEntry,
  UploadedFileRef,
} from '../../types/portal';
import {
  getActiveTrackPrice,
  getEffectiveTracks,
  getTrackAvailability,
  isMultiTrackEvent,
} from '../../utils/eventTracks';
import {
  formatBytes,
  validateAndStoreRegistrationDocument,
} from '../../utils/mediaStorage';
import {
  ModalDialog,
  QrCodeSvg,
  StatusBadge,
  StudioButton,
} from '../ui/Primitives';

interface DynamicTrackRegistrationModalProps {
  open: boolean;
  onClose: () => void;
  event: EventItem;
  registrations: Registration[];
  initialTrackId?: string;
  defaultName: string;
  defaultEmail: string;
  onSubmitRegistration: (payload: {
    eventId: string;
    attendeeName: string;
    attendeeEmail: string;
    enrollmentNo: string;
    utrNumber?: string;
    trackId: string;
    formResponses: Record<string, RegistrationFieldResponse>;
  }) => Registration;
  onCompleted: (reg: Registration) => void;
  onNotify: (title: string, detail?: string, tone?: 'default' | 'success' | 'warning' | 'error') => void;
}

type WizardStep = 'category' | 'details' | 'payment';

export const DynamicTrackRegistrationModal: React.FC<DynamicTrackRegistrationModalProps> = ({
  open,
  onClose,
  event,
  registrations,
  initialTrackId,
  defaultName,
  defaultEmail,
  onSubmitRegistration,
  onCompleted,
  onNotify,
}) => {
  const effectiveTracks = useMemo(() => getEffectiveTracks(event), [event]);
  const multiTrack = isMultiTrackEvent(event);
  const visibleTracks = useMemo(
    () => effectiveTracks.filter((t) => t.visible !== false),
    [effectiveTracks]
  );

  const [step, setStep] = useState<WizardStep>('category');
  const [selectedTrackId, setSelectedTrackId] = useState<string>(
    initialTrackId || visibleTracks[0]?.id || ''
  );

  // Core identity fields
  const [attendeeName, setAttendeeName] = useState(defaultName);
  const [attendeeEmail, setAttendeeEmail] = useState(defaultEmail);
  const [enrollmentNo, setEnrollmentNo] = useState('0827CS241089');

  // Dynamic category-specific answers keyed by field.id
  const [fieldValues, setFieldValues] = useState<Record<string, RegistrationFieldAnswerValue>>({});
  const [uploadingFieldId, setUploadingFieldId] = useState<string | null>(null);

  // Payment proof
  const [utrNumber, setUtrNumber] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reset wizard cleanly whenever modal opens or pre-selected track changes
  useEffect(() => {
    if (!open) return;
    setAttendeeName(defaultName);
    setAttendeeEmail(defaultEmail);
    setErrorMsg('');
    setUtrNumber('');

    if (multiTrack) {
      if (initialTrackId) {
        const pre = visibleTracks.find((t) => t.id === initialTrackId);
        if (pre && getTrackAvailability(event, pre, registrations).canRegister) {
          setSelectedTrackId(pre.id);
          setStep('details');
          setFieldValues({});
          return;
        }
      }
      const firstOpen = visibleTracks.find(
        (t) => getTrackAvailability(event, t, registrations).canRegister
      );
      setSelectedTrackId(firstOpen?.id ?? visibleTracks[0]?.id ?? '');
      setStep('category');
      setFieldValues({});
    } else {
      setSelectedTrackId(effectiveTracks[0]?.id ?? '');
      setStep('details');
      setFieldValues({});
    }
  }, [open, initialTrackId, multiTrack, event.id]);

  const selectedTrack: EventRegistrationTrack | undefined = useMemo(
    () => effectiveTracks.find((t) => t.id === selectedTrackId) ?? effectiveTracks[0],
    [effectiveTracks, selectedTrackId]
  );

  const selectedAvailability = useMemo(
    () =>
      selectedTrack ? getTrackAvailability(event, selectedTrack, registrations) : null,
    [event, selectedTrack, registrations]
  );

  const activeFields = useMemo(
    () =>
      selectedTrack
        ? selectedTrack.registrationFields.filter((f) => f.visible !== false)
        : [],
    [selectedTrack]
  );

  const priceInfo = selectedTrack
    ? getActiveTrackPrice(selectedTrack)
    : { amountInr: 0, isEarlyBird: false };
  const isTrackPaid = Boolean(
    selectedTrack && selectedTrack.pricing.type === 'paid' && priceInfo.amountInr > 0
  );
  const trackUpiId = selectedTrack?.pricing.upiId || event.upiId || 'edcaitr.events@icici';
  const upiUri = `upi://pay?pa=${encodeURIComponent(trackUpiId)}&pn=${encodeURIComponent(
    'EDC AITR Indore'
  )}&am=${priceInfo.amountInr}&cu=INR&tn=${encodeURIComponent(
    `${event.title} - ${selectedTrack?.name ?? 'Pass'}`
  )}`;

  const handleSelectTrack = (track: EventRegistrationTrack) => {
    const avail = getTrackAvailability(event, track, registrations);
    if (!avail.canRegister) return;
    if (track.id !== selectedTrackId) {
      setSelectedTrackId(track.id);
      setFieldValues({});
      setUtrNumber('');
      setErrorMsg('');
    }
  };

  const updateFieldValue = (fieldId: string, val: RegistrationFieldAnswerValue) => {
    setFieldValues((prev) => ({ ...prev, [fieldId]: val }));
  };

  const handleFileUpload = async (field: RegistrationField, file: File) => {
    setErrorMsg('');
    setUploadingFieldId(field.id);
    try {
      const ref = await validateAndStoreRegistrationDocument(file, field.accept);
      updateFieldValue(field.id, ref);
      onNotify('Document attached', `${file.name} (${formatBytes(file.size)})`, 'success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to attach selected file.');
    } finally {
      setUploadingFieldId(null);
    }
  };

  const validateDetailsStep = (): boolean => {
    setErrorMsg('');
    if (!selectedTrack || !selectedAvailability?.canRegister) {
      setErrorMsg('Please select an available participation category.');
      return false;
    }
    if (!attendeeName.trim() || !attendeeEmail.trim() || !enrollmentNo.trim()) {
      setErrorMsg('Please complete your full name, email address, and enrollment/ID number.');
      return false;
    }

    for (const field of activeFields) {
      const raw = fieldValues[field.id];
      if (!field.required) continue;

      if (field.type === 'checkbox') {
        if (raw !== true) {
          setErrorMsg(`Please confirm "${field.label}".`);
          return false;
        }
      } else if (field.type === 'multiselect') {
        if (!Array.isArray(raw) || raw.length === 0) {
          setErrorMsg(`Please select at least one option for "${field.label}".`);
          return false;
        }
      } else if (field.type === 'team_members') {
        const list = (raw as TeamMemberEntry[] | undefined) ?? [];
        const validEntries = list.filter((m) => m.name.trim().length > 0);
        if (validEntries.length === 0) {
          setErrorMsg(`Please add at least one member under "${field.label}".`);
          return false;
        }
      } else if (field.type === 'file') {
        const fileVal = raw as UploadedFileRef | undefined;
        if (!fileVal?.assetRef) {
          setErrorMsg(`Please upload a file for "${field.label}".`);
          return false;
        }
      } else {
        if (raw === undefined || raw === null || String(raw).trim() === '') {
          setErrorMsg(`Please complete the required field: "${field.label}".`);
          return false;
        }
      }
    }

    return true;
  };

  const buildFormResponses = (): Record<string, RegistrationFieldResponse> => {
    const out: Record<string, RegistrationFieldResponse> = {};
    for (const field of activeFields) {
      const value = fieldValues[field.id];
      if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
        continue;
      }
      if (field.type === 'team_members' && Array.isArray(value)) {
        const cleaned = (value as TeamMemberEntry[]).filter((m) => m.name.trim());
        if (cleaned.length === 0) continue;
        out[field.id] = { fieldId: field.id, label: field.label, type: field.type, value: cleaned };
        continue;
      }
      out[field.id] = {
        fieldId: field.id,
        label: field.label,
        type: field.type,
        value,
      };
    }
    return out;
  };

  const executeFinalSubmit = () => {
    if (!selectedTrack) return;
    setErrorMsg('');
    if (isTrackPaid && utrNumber.trim().length < 8) {
      setErrorMsg('Enter a valid UPI UTR / transaction reference ID (minimum 8 characters).');
      return;
    }

    setSubmitting(true);
    window.setTimeout(() => {
      try {
        const reg = onSubmitRegistration({
          eventId: event.id,
          attendeeName,
          attendeeEmail,
          enrollmentNo,
          utrNumber: isTrackPaid ? utrNumber : undefined,
          trackId: selectedTrack.id,
          formResponses: buildFormResponses(),
        });
        setSubmitting(false);
        onClose();
        onCompleted(reg);
      } catch (err) {
        setSubmitting(false);
        setErrorMsg(err instanceof Error ? err.message : 'Unable to complete registration.');
      }
    }, 320);
  };

  const handleDetailsFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateDetailsStep()) return;

    // Free tracks skip payment entirely and confirm directly!
    if (!isTrackPaid) {
      executeFinalSubmit();
      return;
    }
    setStep('payment');
  };

  const handleCopyUpi = () => {
    navigator.clipboard?.writeText(trackUpiId).catch(() => {});
    setCopiedUpi(true);
    onNotify('UPI ID copied', trackUpiId);
    window.setTimeout(() => setCopiedUpi(false), 2000);
  };

  const renderDynamicField = (field: RegistrationField) => {
    const val = fieldValues[field.id];

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            rows={3}
            required={field.required}
            value={(val as string) ?? ''}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            placeholder={field.placeholder}
            className="studio-input text-xs resize-y"
          />
        );

      case 'select':
        return (
          <select
            required={field.required}
            value={(val as string) ?? ''}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            className="studio-input text-xs"
          >
            <option value="">Select an option…</option>
            {(field.options ?? []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="flex flex-wrap gap-2 pt-0.5">
            {(field.options ?? []).map((opt) => {
              const checked = val === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => updateFieldValue(field.id, opt)}
                  className={`px-3 py-1.5 rounded-[7px] border text-xs font-medium cursor-pointer transition-colors ${
                    checked
                      ? 'bg-[#030405] dark:bg-[#F1F0ED] text-white dark:text-[#101011] border-[#030405] dark:border-[#F1F0ED]'
                      : 'bg-[var(--surface)] text-[var(--ink-secondary)] border-[var(--border-hairline)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        );

      case 'checkbox':
        return (
          <label className="inline-flex items-start gap-2.5 text-xs text-[var(--ink-secondary)] cursor-pointer select-none pt-0.5">
            <input
              type="checkbox"
              checked={Boolean(val)}
              onChange={(e) => updateFieldValue(field.id, e.target.checked)}
              className="mt-0.5 accent-[#C01E30]"
            />
            <span>{field.placeholder || field.label}</span>
          </label>
        );

      case 'multiselect': {
        const selectedList = Array.isArray(val) ? (val as string[]) : [];
        return (
          <div className="flex flex-wrap gap-2 pt-0.5">
            {(field.options ?? []).map((opt) => {
              const active = selectedList.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    const next = active
                      ? selectedList.filter((item) => item !== opt)
                      : [...selectedList, opt];
                    updateFieldValue(field.id, next);
                  }}
                  className={`px-2.5 py-1.5 rounded-[7px] border text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                    active
                      ? 'border-[#C01E30] bg-[var(--accent-soft)] text-[#C01E30] dark:text-[#E67C87]'
                      : 'border-[var(--border-hairline)] bg-[var(--surface)] text-[var(--ink-secondary)]'
                  }`}
                >
                  {active && <Check className="h-3 w-3" />}
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>
        );
      }

      case 'file': {
        const fileRef = val as UploadedFileRef | undefined;
        const isUploading = uploadingFieldId === field.id;
        return (
          <div className="space-y-1.5">
            <label className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-[8px] border border-dashed border-[var(--border-strong)] bg-[var(--surface-subtle)] hover:border-[#C01E30] transition-colors cursor-pointer">
              <div className="flex items-center gap-2.5 min-w-0">
                {fileRef ? (
                  <FileText className="h-4 w-4 text-[#15803D] dark:text-emerald-400 shrink-0" />
                ) : (
                  <Upload className="h-4 w-4 text-[#C01E30] shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[var(--color-2-mood)] truncate">
                    {isUploading
                      ? 'Storing file in browser IndexedDB…'
                      : fileRef
                        ? fileRef.name
                        : 'Click to upload file (PDF, PPTX, DOCX, or Image)'}
                  </p>
                  <p className="text-[11px] text-[var(--ink-muted)]">
                    {fileRef
                      ? `${formatBytes(fileRef.size)} · Ready for RD & Jury inspection`
                      : 'Max 10 MB · Stored locally in IndexedDB'}
                  </p>
                </div>
              </div>
              <input
                type="file"
                accept={field.accept || '.pdf,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png,.webp'}
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleFileUpload(field, f);
                  e.target.value = '';
                }}
              />
              <span className="text-[11px] font-medium text-[#C01E30] shrink-0">
                {fileRef ? 'Replace' : 'Browse'}
              </span>
            </label>
          </div>
        );
      }

      case 'team_members': {
        const members: TeamMemberEntry[] =
          Array.isArray(val) && val.length > 0
            ? (val as TeamMemberEntry[])
            : [{ name: '', role: '', email: '' }];
        return (
          <div className="space-y-2">
            {members.map((member, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <input
                  type="text"
                  value={member.name}
                  onChange={(e) => {
                    const next = [...members];
                    next[idx] = { ...next[idx], name: e.target.value };
                    updateFieldValue(field.id, next);
                  }}
                  placeholder={`Member ${idx + 1} full name`}
                  className="studio-input text-xs sm:col-span-5"
                />
                <input
                  type="text"
                  value={member.role ?? ''}
                  onChange={(e) => {
                    const next = [...members];
                    next[idx] = { ...next[idx], role: e.target.value };
                    updateFieldValue(field.id, next);
                  }}
                  placeholder="Role (e.g. Co-Founder)"
                  className="studio-input text-xs sm:col-span-3"
                />
                <input
                  type="email"
                  value={member.email ?? ''}
                  onChange={(e) => {
                    const next = [...members];
                    next[idx] = { ...next[idx], email: e.target.value };
                    updateFieldValue(field.id, next);
                  }}
                  placeholder="Email (optional)"
                  className="studio-input text-xs sm:col-span-3"
                />
                <button
                  type="button"
                  disabled={members.length <= 1}
                  onClick={() => {
                    const next = members.filter((_, i) => i !== idx);
                    updateFieldValue(field.id, next);
                  }}
                  className="h-8 w-8 rounded-[7px] border border-[var(--border-hairline)] flex items-center justify-center text-[#C01E30] disabled:opacity-30 cursor-pointer sm:col-span-1"
                  title="Remove member"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <StudioButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                updateFieldValue(field.id, [...members, { name: '', role: '', email: '' }])
              }
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Team Member</span>
            </StudioButton>
          </div>
        );
      }

      default: {
        const inputType =
          field.type === 'email'
            ? 'email'
            : field.type === 'number'
              ? 'number'
              : field.type === 'url'
                ? 'url'
                : field.type === 'date'
                  ? 'date'
                  : field.type === 'phone'
                    ? 'tel'
                    : 'text';
        return (
          <input
            type={inputType}
            required={field.required}
            value={(val as string | number) ?? ''}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            placeholder={field.placeholder}
            className="studio-input text-xs"
          />
        );
      }
    }
  };

  const stepSubtitle =
    step === 'category'
      ? 'Select your participation category to load its tailored registration form and fee.'
      : step === 'payment'
        ? `Complete UPI payment of ₹${priceInfo.amountInr} for ${selectedTrack?.name} and submit your UTR.`
        : selectedTrack
          ? `${selectedTrack.name} · ${
              isTrackPaid ? `₹${priceInfo.amountInr} via UPI` : 'Complimentary Pass'
            }`
          : 'Complete your event registration details.';

  return (
    <ModalDialog
      open={open}
      onClose={onClose}
      isDirty={Boolean(utrNumber.trim() || Object.keys(fieldValues).length > 0)}
      dirtyWarningText="Your registration progress has unsaved entries. Discard and close?"
      title={`Register — ${event.title}`}
      subtitle={stepSubtitle}
      maxWidthClass="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Progress Indicator for Multi-Track or Paid Events */}
        {(multiTrack || isTrackPaid) && (
          <div className="flex items-center gap-2 text-[11px] font-mono">
            {multiTrack && (
              <span
                className={`px-2.5 py-1 rounded-[5px] border ${
                  step === 'category'
                    ? 'bg-[#030405] dark:bg-[#F1F0ED] text-white dark:text-[#101011] border-[#030405] dark:border-[#F1F0ED]'
                    : 'bg-[var(--surface-subtle)] text-[var(--ink-muted)] border-[var(--border-hairline)]'
                }`}
              >
                1. Category
              </span>
            )}
            <span
              className={`px-2.5 py-1 rounded-[5px] border ${
                step === 'details'
                  ? 'bg-[#030405] dark:bg-[#F1F0ED] text-white dark:text-[#101011] border-[#030405] dark:border-[#F1F0ED]'
                  : 'bg-[var(--surface-subtle)] text-[var(--ink-muted)] border-[var(--border-hairline)]'
              }`}
            >
              {multiTrack ? '2. Registration Form' : '1. Registration Form'}
            </span>
            {isTrackPaid && (
              <span
                className={`px-2.5 py-1 rounded-[5px] border ${
                  step === 'payment'
                    ? 'bg-[#C01E30] text-white border-[#C01E30]'
                    : 'bg-[var(--surface-subtle)] text-[var(--ink-muted)] border-[var(--border-hairline)]'
                }`}
              >
                {multiTrack ? '3. UPI Proof' : '2. UPI Proof'}
              </span>
            )}
          </div>
        )}

        {/* STEP 1: MULTI-TRACK CATEGORY SELECTION */}
        {step === 'category' && multiTrack && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-2-mood)]">
              <Layers className="h-4 w-4 text-[#C01E30]" />
              <span>How would you like to participate?</span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {visibleTracks.map((track) => {
                const avail = getTrackAvailability(event, track, registrations);
                const tPrice = getActiveTrackPrice(track);
                const selected = selectedTrackId === track.id;
                return (
                  <button
                    key={track.id}
                    type="button"
                    disabled={!avail.canRegister}
                    onClick={() => handleSelectTrack(track)}
                    className={`p-4 rounded-[9px] border text-left transition-colors ${
                      !avail.canRegister
                        ? 'opacity-55 cursor-not-allowed border-[var(--border-hairline)] bg-[var(--surface-subtle)]'
                        : selected
                          ? 'border-[#C01E30] bg-[var(--accent-soft)] cursor-pointer'
                          : 'border-[var(--border-hairline)] bg-[var(--surface)] hover:border-[var(--border-strong)] cursor-pointer'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-display font-semibold text-[var(--color-2-mood)]">
                            {track.name}
                          </span>
                          <StatusBadge label={avail.statusLabel} tone={avail.statusTone} />
                        </div>
                        <p className="text-xs text-[var(--ink-secondary)] mt-1 leading-relaxed">
                          {track.description}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono text-base font-semibold text-[var(--color-2-mood)]">
                          {track.pricing.type === 'paid' && tPrice.amountInr > 0
                            ? `₹${tPrice.amountInr}`
                            : 'Free'}
                        </p>
                        <p className="text-[11px] font-mono text-[var(--ink-muted)]">
                          {avail.remainingSeats === null
                            ? 'Unlimited'
                            : `${avail.remainingSeats} left`}
                        </p>
                      </div>
                    </div>
                    {track.eligibility && (
                      <p className="text-[11px] text-[var(--ink-muted)] mt-2 pt-2 border-t border-[var(--border-hairline)]">
                        Eligibility: {track.eligibility}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border-hairline)]">
              <StudioButton type="button" variant="secondary" onClick={onClose}>
                Cancel
              </StudioButton>
              <StudioButton
                type="button"
                variant="primary"
                disabled={!selectedTrack || !selectedAvailability?.canRegister}
                onClick={() => {
                  setErrorMsg('');
                  setStep('details');
                }}
              >
                <span>Continue with {selectedTrack?.name}</span>
                <ArrowRight className="h-4 w-4" />
              </StudioButton>
            </div>
          </div>
        )}

        {/* STEP 2: DYNAMIC CATEGORY-SPECIFIC FORM */}
        {step === 'details' && selectedTrack && (
          <form onSubmit={handleDetailsFormSubmit} className="space-y-4">
            {/* Selected Category Summary Strip */}
            <div className="p-3.5 rounded-[9px] bg-[var(--surface-subtle)] border border-[var(--border-hairline)] flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[var(--color-2-mood)]">
                    {selectedTrack.name}
                  </span>
                  <StatusBadge
                    label={isTrackPaid ? `₹${priceInfo.amountInr}` : 'Free Pass'}
                    tone={isTrackPaid ? 'crimson' : 'green'}
                  />
                </div>
                {selectedTrack.instructions && (
                  <p className="text-[11px] text-[var(--ink-muted)] mt-1">
                    {selectedTrack.instructions}
                  </p>
                )}
              </div>
              {multiTrack && (
                <button
                  type="button"
                  onClick={() => setStep('category')}
                  className="text-xs font-medium text-[#C01E30] dark:text-[#E67C87] hover:underline cursor-pointer"
                >
                  Change Category
                </button>
              )}
            </div>

            {/* Core Identity Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-[var(--color-2-mood)] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={attendeeName}
                  onChange={(e) => setAttendeeName(e.target.value)}
                  placeholder="e.g. Kabir Sharma"
                  className="studio-input text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-2-mood)] mb-1">
                  Enrollment / Institutional ID *
                </label>
                <input
                  type="text"
                  required
                  value={enrollmentNo}
                  onChange={(e) => setEnrollmentNo(e.target.value)}
                  placeholder="0827CS241089 or ORG-ID"
                  className="studio-input text-xs font-mono"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[var(--color-2-mood)] mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={attendeeEmail}
                  onChange={(e) => setAttendeeEmail(e.target.value)}
                  placeholder="name@acropolis.in"
                  className="studio-input text-xs"
                />
              </div>
            </div>

            {/* Track-Specific Dynamic Form Fields */}
            {activeFields.length > 0 && (
              <div className="pt-3 border-t border-[var(--border-hairline)] space-y-3.5">
                <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--ink-muted)]">
                  {selectedTrack.name} Details
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {activeFields.map((field) => {
                    const fullSpan =
                      field.type === 'textarea' ||
                      field.type === 'file' ||
                      field.type === 'team_members' ||
                      field.type === 'multiselect' ||
                      field.type === 'radio' ||
                      field.type === 'checkbox';
                    return (
                      <div key={field.id} className={fullSpan ? 'sm:col-span-2' : ''}>
                        {field.type !== 'checkbox' && (
                          <label className="block text-xs font-medium text-[var(--color-2-mood)] mb-1">
                            {field.label} {field.required ? '*' : ''}
                          </label>
                        )}
                        {renderDynamicField(field)}
                        {field.description && (
                          <p className="text-[11px] text-[var(--ink-muted)] mt-1">
                            {field.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-2.5 rounded-[7px] bg-[var(--accent-soft)] border border-[var(--accent-border)] flex items-start gap-2 text-xs text-[#C01E30] dark:text-[#F87171]">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-[var(--border-hairline)]">
              <div>
                {multiTrack && (
                  <StudioButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep('category')}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Categories</span>
                  </StudioButton>
                )}
              </div>
              <div className="flex items-center gap-2">
                <StudioButton type="button" variant="secondary" onClick={onClose}>
                  Cancel
                </StudioButton>
                <StudioButton type="submit" variant="primary" loading={submitting}>
                  {isTrackPaid ? (
                    <>
                      <span>Proceed to Payment (₹{priceInfo.amountInr})</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Confirm Free Registration</span>
                    </>
                  )}
                </StudioButton>
              </div>
            </div>
          </form>
        )}

        {/* STEP 3: CATEGORY-SPECIFIC UPI PAYMENT PROOF (PAID TRACKS ONLY) */}
        {step === 'payment' && selectedTrack && isTrackPaid && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              executeFinalSubmit();
            }}
            className="space-y-4"
          >
            <div className="studio-subtle p-4 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <div className="sm:col-span-5 flex flex-col items-center">
                <QrCodeSvg
                  value={upiUri}
                  size={148}
                  label={`UPI Payment QR for ${event.title} - ${selectedTrack.name}`}
                />
                <span className="text-[11px] font-mono-data text-[var(--ink-muted)] mt-1.5">
                  Scan via any UPI app
                </span>
              </div>
              <div className="sm:col-span-7 space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge label={selectedTrack.name} tone="obsidian" />
                  <StatusBadge label={`Payable: ₹${priceInfo.amountInr}`} tone="crimson" />
                </div>
                {selectedTrack.pricing.feeDescription && (
                  <p className="text-xs text-[var(--ink-secondary)]">
                    {selectedTrack.pricing.feeDescription}
                  </p>
                )}
                <div>
                  <p className="text-xs text-[var(--ink-muted)]">Official EDC AITR UPI ID</p>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="font-mono-data text-xs font-semibold text-[var(--color-2-mood)] bg-[var(--surface)] border border-[var(--border-strong)] rounded-[6px] px-2.5 py-1.5 flex-1 truncate">
                      {trackUpiId}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="h-8 px-2.5 rounded-[6px] border border-[var(--border-strong)] bg-[var(--surface)] text-xs font-medium text-[var(--color-2-mood)] hover:bg-[var(--surface-subtle)] inline-flex items-center gap-1 cursor-pointer"
                    >
                      {copiedUpi ? (
                        <Check className="h-3.5 w-3.5 text-[#15803D] dark:text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
                <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                  After UPI transfer, submit your 12-digit UTR reference below. Your entry QR unlocks
                  once the RD desk verifies payment.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--color-2-mood)] mb-1.5">
                UPI UTR / Transaction Reference ID *
              </label>
              <input
                type="text"
                required
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                placeholder="e.g. 605841902311"
                className="studio-input font-mono-data"
              />
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-[7px] bg-[var(--accent-soft)] border border-[var(--accent-border)] flex items-start gap-2 text-xs text-[#C01E30] dark:text-[#F87171]">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-[var(--border-hairline)]">
              <StudioButton
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setErrorMsg('');
                  setStep('details');
                }}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Edit Details</span>
              </StudioButton>
              <div className="flex items-center gap-2">
                <StudioButton type="button" variant="secondary" onClick={onClose}>
                  Cancel
                </StudioButton>
                <StudioButton type="submit" variant="primary" loading={submitting}>
                  Submit Registration &amp; UTR Proof
                </StudioButton>
              </div>
            </div>
          </form>
        )}
      </div>
    </ModalDialog>
  );
};
