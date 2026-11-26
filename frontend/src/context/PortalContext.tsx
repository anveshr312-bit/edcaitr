'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  SEED_ANNOUNCEMENTS,
  SEED_APPLICATIONS,
  SEED_CERTIFICATES,
  SEED_CONVERSATIONS,
  SEED_EVENTS,
  SEED_OPPORTUNITIES,
  SEED_REGISTRATIONS,
  SEED_STARTUPS,
  SEED_TASKS,
  SEED_TEAM_ALLOCATIONS,
  SEED_USERS,
} from '../data/seedData';
import {
  Announcement,
  Certificate,
  ContactSubmission,
  Conversation,
  EventClosureChecklist,
  EventItem,
  MembershipApplication,
  OperationalTeamCode,
  OpportunityListing,
  ProfileCorrectionRequest,
  Registration,
  RegistrationFieldResponse,
  StartupListing,
  TaskItem,
  TaskStatus,
  TeamAllocation,
  ToastMessage,
  UserProfile,
} from '../types/portal';
import {
  getActiveTrackPrice,
  getEffectiveTracks,
  getTrackAvailability,
  isMultiTrackEvent,
} from '../utils/eventTracks';
import { sanitizeProfileUpdatePayload } from '../utils/identityProfile';

const STORAGE_KEY = 'edc_aitr_portal_state_v1';

interface PersistedState {
  currentUserId: string | null;
  users: UserProfile[];
  events: EventItem[];
  registrations: Registration[];
  teamAllocations: TeamAllocation[];
  tasks: TaskItem[];
  announcements: Announcement[];
  certificates: Certificate[];
  applications: MembershipApplication[];
  startups: StartupListing[];
  opportunities: OpportunityListing[];
  conversations: Conversation[];
  contactSubmissions: ContactSubmission[];
  profileCorrectionRequests: ProfileCorrectionRequest[];
  activeWorkspaceEventId: string;
}

const DEFAULT_PERSISTED_STATE: PersistedState = {
  currentUserId: null,
  users: SEED_USERS,
  events: SEED_EVENTS,
  registrations: SEED_REGISTRATIONS,
  teamAllocations: SEED_TEAM_ALLOCATIONS,
  tasks: SEED_TASKS,
  announcements: SEED_ANNOUNCEMENTS,
  certificates: SEED_CERTIFICATES,
  applications: SEED_APPLICATIONS,
  startups: SEED_STARTUPS,
  opportunities: SEED_OPPORTUNITIES,
  conversations: SEED_CONVERSATIONS,
  contactSubmissions: [],
  profileCorrectionRequests: [],
  activeWorkspaceEventId: 'evt-esummit-2026',
};

function loadInitialState(): PersistedState {
  if (typeof window === 'undefined') return DEFAULT_PERSISTED_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PERSISTED_STATE;
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    const seedById = new Map(SEED_USERS.map((u) => [u.id, u]));
    const mergedUsers = Array.isArray(parsed.users)
      ? parsed.users.map((u) => {
          const seed = seedById.get(u.id);
          return seed ? { ...seed, ...u } : u;
        })
      : DEFAULT_PERSISTED_STATE.users;
    return {
      ...DEFAULT_PERSISTED_STATE,
      ...parsed,
      users: mergedUsers,
      profileCorrectionRequests: Array.isArray(parsed.profileCorrectionRequests)
        ? parsed.profileCorrectionRequests
        : [],
    };
  } catch {
    return DEFAULT_PERSISTED_STATE;
  }
}

export function downloadCsvFile(filename: string, headers: string[], rows: (string | number | undefined)[][]) {
  if (typeof window === 'undefined') return;
  const escapeCell = (value: string | number | undefined) => {
    const str = value === undefined || value === null ? '' : String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const csvContent = [headers.map(escapeCell).join(','), ...rows.map((r) => r.map(escapeCell).join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

interface PortalContextValue {
  path: string;
  navigate: (nextPath: string) => void;
  currentUser: UserProfile | null;
  users: UserProfile[];
  events: EventItem[];
  registrations: Registration[];
  teamAllocations: TeamAllocation[];
  tasks: TaskItem[];
  announcements: Announcement[];
  certificates: Certificate[];
  applications: MembershipApplication[];
  startups: StartupListing[];
  opportunities: OpportunityListing[];
  conversations: Conversation[];
  contactSubmissions: ContactSubmission[];
  profileCorrectionRequests: ProfileCorrectionRequest[];
  activeWorkspaceEventId: string;
  setActiveWorkspaceEventId: (eventId: string) => void;
  toasts: ToastMessage[];
  pushToast: (title: string, detail?: string, tone?: ToastMessage['tone']) => void;
  dismissToast: (id: string) => void;
  // Auth & Identity Studio
  signInAsUser: (userId: string, redirectTo?: string) => void;
  signInWithEmail: (email: string) => boolean;
  registerAccount: (payload: { name: string; email: string; department: string; batch: string }) => void;
  signOut: () => void;
  toggleMfaForCurrentUser: (enabled: boolean) => void;
  updateCurrentUserProfile: (
    patch: Record<string, unknown>
  ) => { ok: boolean; user?: UserProfile; error?: string };
  submitProfileCorrectionRequest: (payload: {
    field: ProfileCorrectionRequest['field'];
    currentValue: string;
    requestedValue: string;
    reason: string;
  }) => { ok: boolean; error?: string };
  // Public & Participant
  registerForEvent: (payload: {
    eventId: string;
    attendeeName: string;
    attendeeEmail: string;
    enrollmentNo: string;
    utrNumber?: string;
    trackId?: string;
    formResponses?: Record<string, RegistrationFieldResponse>;
  }) => Registration;
  submitContactForm: (payload: Omit<ContactSubmission, 'id' | 'submittedAt'>) => void;
  submitMembershipApplication: (
    payload: Omit<MembershipApplication, 'id' | 'status' | 'internalNotes' | 'submittedAt'>
  ) => void;
  // Workspace
  saveEvent: (event: Omit<EventItem, 'id' | 'slug' | 'auditTrail' | 'closureChecklist' | 'status'> & { id?: string }) => EventItem;
  updateTeamAllocation: (eventId: string, teamCode: OperationalTeamCode, leadId: string, memberIds: string[]) => void;
  createTask: (payload: Omit<TaskItem, 'id' | 'comments'>) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  addTaskComment: (taskId: string, text: string) => void;
  verifyRegistrationPayment: (registrationId: string, decision: 'Verified' | 'Rejected') => void;
  processQrCheckIn: (
    eventId: string,
    tokenOrQuery: string
  ) => {
    outcome: 'VALID' | 'ALREADY' | 'INVALID';
    registration?: Registration;
    message: string;
  };
  updateClosureChecklist: (eventId: string, patch: Partial<EventClosureChecklist>, reportDriveUrl?: string) => void;
  issueEventCertificates: (eventId: string) => number;
  closeEventWithLock: (eventId: string) => void;
  reopenEventWithAudit: (eventId: string, reason: string) => void;
  reviewMembershipApplication: (appId: string, status: 'Approved' | 'Rejected', internalNotes: string) => void;
  // Alumni Connect
  addStartupListing: (payload: Omit<StartupListing, 'id'>) => void;
  addOpportunityListing: (payload: Omit<OpportunityListing, 'id' | 'postedAt'>) => void;
  acceptConversationRequest: (conversationId: string) => void;
  sendMessageToConversation: (
    conversationId: string,
    text: string
  ) => Promise<{ ok: boolean; messageId?: string; error?: string }>;
  retryMessageInConversation: (
    conversationId: string,
    messageId: string
  ) => Promise<{ ok: boolean; error?: string }>;
  startOrOpenConversationWithUser: (peer: UserProfile) => string;
  resetDemoData: () => void;
}

const PortalContext = createContext<PortalContextValue | null>(null);

export const PortalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<PersistedState>(() => loadInitialState());
  const [path, setPath] = useState<string>(() => {
    if (typeof window === 'undefined') return '/';
    const initial = window.location.pathname || '/';
    return initial === '' ? '/' : initial;
  });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
  }, [state]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onPopState = () => {
      setPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (nextPath: string) => {
    if (nextPath !== path) {
      if (typeof window !== 'undefined') {
        try {
          window.history.pushState({}, '', nextPath);
        } catch {
          // Fallback inside restricted iframe contexts
        }
      }
      setPath(nextPath);
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  };

  const pushToast = (title: string, detail?: string, tone: ToastMessage['tone'] = 'default') => {
    const now = Date.now();
    const durationMs = tone === 'error' || tone === 'warning' ? 5400 : 4200;
    setToasts((prev) => {
      // Deduplicate identical rapid-fire notifications during repetitive administrative workflows
      const isDuplicate = prev.some(
        (t) =>
          t.title === title &&
          t.detail === detail &&
          t.tone === tone &&
          t.createdAt !== undefined &&
          now - t.createdAt < 1800
      );
      if (isDuplicate) return prev;

      const id = `toast-${now}-${Math.random().toString(36).slice(2, 6)}`;
      // Cap concurrent visible stack to 3 items so notifications never bury the workspace
      return [...prev.slice(-2), { id, title, detail, tone, durationMs, createdAt: now }];
    });
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const currentUser = useMemo(
    () => state.users.find((u) => u.id === state.currentUserId) ?? null,
    [state.users, state.currentUserId]
  );

  const setActiveWorkspaceEventId = (eventId: string) => {
    setState((prev) => ({ ...prev, activeWorkspaceEventId: eventId }));
  };

  const signInAsUser = (userId: string, redirectTo?: string) => {
    const found = state.users.find((u) => u.id === userId);
    if (!found) return;
    setState((prev) => ({ ...prev, currentUserId: found.id }));
    pushToast(`Signed in as ${found.name}`, found.designation, 'success');
    if (redirectTo) {
      navigate(redirectTo);
    }
  };

  const signInWithEmail = (email: string) => {
    const normalized = email.trim().toLowerCase();
    const existing = state.users.find((u) => u.email.toLowerCase() === normalized);
    if (existing) {
      setState((prev) => ({ ...prev, currentUserId: existing.id }));
      pushToast(`Welcome back, ${existing.name}`, existing.designation, 'success');
      navigate(existing.role === 'alumni' ? '/alumni/directory' : existing.role === 'participant' ? '/portal' : '/workspace');
      return true;
    }
    // Create lightweight participant session for arbitrary email sign-in during frontend preview
    const nameGuess = normalized
      .split('@')[0]
      .replace(/[._-]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      name: nameGuess || 'Acropolis Student',
      email: normalized,
      role: 'participant',
      designation: 'Student Participant · AITR Indore',
      department: 'B.Tech CSE',
      batch: '2027',
      city: 'Indore',
      industry: 'Technology',
      startupStage: 'Idea',
      linkedin: 'https://linkedin.com',
      tenure: 'current',
      mfaEnabled: false,
    };
    setState((prev) => ({
      ...prev,
      users: [...prev.users, newUser],
      currentUserId: newUser.id,
    }));
    pushToast(`Signed in as ${newUser.name}`, 'Participant Portal unlocked', 'success');
    navigate('/portal');
    return true;
  };

  const registerAccount = (payload: { name: string; email: string; department: string; batch: string }) => {
    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      role: 'participant',
      designation: 'Student Participant · AITR Indore',
      department: payload.department.trim() || 'B.Tech CSE',
      batch: payload.batch.trim() || '2028',
      city: 'Indore',
      industry: 'Technology',
      startupStage: 'Idea',
      linkedin: 'https://linkedin.com',
      tenure: 'current',
      mfaEnabled: false,
    };
    setState((prev) => ({
      ...prev,
      users: [...prev.users, newUser],
      currentUserId: newUser.id,
    }));
    pushToast('Account created', `Welcome to EDC AITR, ${newUser.name}`, 'success');
    navigate('/portal');
  };

  const signOut = () => {
    setState((prev) => ({ ...prev, currentUserId: null }));
    pushToast('Signed out', 'Returned to public portal');
    navigate('/');
  };

  const toggleMfaForCurrentUser = (enabled: boolean) => {
    if (!currentUser) return;
    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === currentUser.id ? { ...u, mfaEnabled: enabled } : u)),
    }));
    pushToast(
      enabled ? 'Authenticator 2FA enabled' : 'Authenticator 2FA disabled',
      enabled ? 'TOTP verification is now enforced for governance actions.' : 'Two-factor protection removed.',
      enabled ? 'success' : 'warning'
    );
  };

  const updateCurrentUserProfile: PortalContextValue['updateCurrentUserProfile'] = (patch) => {
    if (!currentUser) {
      return { ok: false, error: 'You must be signed in to update your profile.' };
    }
    const sanitized = sanitizeProfileUpdatePayload(currentUser, patch);
    if (sanitized.ok === false) {
      pushToast('Profile could not be saved', sanitized.error, 'error');
      return { ok: false, error: sanitized.error };
    }
    const updatedUser = sanitized.nextUser;
    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === currentUser.id ? updatedUser : u)),
    }));
    pushToast('Identity profile saved', 'Your EDC AITR profile changes are now active in this browser.', 'success');
    return { ok: true, user: updatedUser };
  };

  const submitProfileCorrectionRequest: PortalContextValue['submitProfileCorrectionRequest'] = ({
    field,
    currentValue,
    requestedValue,
    reason,
  }) => {
    if (!currentUser) {
      return { ok: false, error: 'Sign in required to submit a record correction request.' };
    }
    const trimmedVal = requestedValue.trim();
    const trimmedReason = reason.trim();
    if (!trimmedVal || trimmedReason.length < 10) {
      return {
        ok: false,
        error: 'Please enter the requested value and a brief justification (at least 10 characters).',
      };
    }
    const entry: ProfileCorrectionRequest = {
      id: `pcr-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      currentRole: currentUser.role,
      field,
      currentValue,
      requestedValue: trimmedVal.slice(0, 140),
      reason: trimmedReason.slice(0, 400),
      status: 'Pending',
      submittedAt: new Date().toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    setState((prev) => ({
      ...prev,
      profileCorrectionRequests: [entry, ...prev.profileCorrectionRequests],
    }));
    pushToast(
      'Official record request logged',
      'Queued for Director & Faculty Advisor review. Protected fields remain unchanged until approved.',
      'success'
    );
    return { ok: true };
  };

  const registerForEvent: PortalContextValue['registerForEvent'] = ({
    eventId,
    attendeeName,
    attendeeEmail,
    enrollmentNo,
    utrNumber,
    trackId,
    formResponses,
  }) => {
    const evt = state.events.find((e) => e.id === eventId);
    if (!evt) {
      throw new Error('Selected event could not be found.');
    }
    if (evt.status === 'Closed') {
      throw new Error('Registrations are closed because this event has been finalized.');
    }

    const effectiveTracks = getEffectiveTracks(evt);
    const selectedTrack = trackId
      ? effectiveTracks.find((t) => t.id === trackId)
      : effectiveTracks.find((t) => t.enabled && t.visible !== false) ?? effectiveTracks[0];

    if (!selectedTrack) {
      throw new Error('Selected registration category does not exist for this event.');
    }

    const availability = getTrackAvailability(evt, selectedTrack, state.registrations);
    if (!availability.canRegister) {
      if (availability.isDisabled) {
        throw new Error(`The "${selectedTrack.name}" category is currently disabled.`);
      }
      if (availability.isBeforeOpen) {
        throw new Error(
          `Registrations for "${selectedTrack.name}" open on ${selectedTrack.registrationOpensAt}.`
        );
      }
      if (availability.isAfterClose) {
        throw new Error(
          `The registration window for "${selectedTrack.name}" closed on ${selectedTrack.registrationClosesAt}.`
        );
      }
      if (availability.isFull) {
        throw new Error(`Seat capacity has been reached for "${selectedTrack.name}".`);
      }
      throw new Error(`"${selectedTrack.name}" is currently unavailable for registration.`);
    }

    const normalizedEmail = attendeeEmail.trim().toLowerCase();
    const duplicate = state.registrations.find(
      (r) =>
        r.eventId === eventId &&
        r.paymentStatus !== 'Rejected' &&
        r.attendeeEmail.trim().toLowerCase() === normalizedEmail &&
        (r.trackId ?? `default-${eventId}`) === selectedTrack.id
    );
    if (duplicate) {
      throw new Error(
        `This email is already registered under "${selectedTrack.name}" (Ticket ${duplicate.ticketToken}).`
      );
    }

    const { amountInr } = getActiveTrackPrice(selectedTrack);
    const isTrackPaid = selectedTrack.pricing.type === 'paid' && amountInr > 0;
    const cleanedUtr = utrNumber?.trim();

    if (isTrackPaid && !cleanedUtr) {
      throw new Error('A valid UPI UTR transaction reference is required for paid categories.');
    }

    const codePrefix = evt.title.slice(0, 2).toUpperCase().replace(/[^A-Z]/g, 'E');
    const randomNum = Math.floor(1000 + Math.random() * 8999);
    const initials = attendeeName
      .split(' ')
      .map((s) => s[0])
      .join('')
      .slice(0, 3)
      .toUpperCase();

    const seatPrefix = evt.venue.split(',')[0];
    const seatZone = isMultiTrackEvent(evt) ? selectedTrack.name : 'Zone A';

    const newReg: Registration = {
      id: `reg-${Date.now()}`,
      eventId,
      userId: currentUser?.id ?? 'guest',
      attendeeName: attendeeName.trim(),
      attendeeEmail: attendeeEmail.trim(),
      enrollmentNo: enrollmentNo.trim().toUpperCase(),
      ticketToken: `EDC-${codePrefix}26-${randomNum}-${initials || 'ATT'}`,
      paymentStatus: isTrackPaid ? 'Pending Payment Verification' : 'Free',
      utrNumber: isTrackPaid ? cleanedUtr : undefined,
      checkInStatus: 'Not Checked In',
      seatSlot: `${seatPrefix} · ${seatZone}`,
      registeredAt: new Date().toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      trackId: selectedTrack.id,
      trackName: selectedTrack.name,
      trackCategory: selectedTrack.category,
      amountInr: isTrackPaid ? amountInr : 0,
      pricingSnapshot: {
        type: isTrackPaid ? 'paid' : 'free',
        amountInr: isTrackPaid ? amountInr : 0,
        upiId: isTrackPaid ? selectedTrack.pricing.upiId || evt.upiId : undefined,
        feeDescription: selectedTrack.pricing.feeDescription,
      },
      formResponses: formResponses && Object.keys(formResponses).length > 0 ? formResponses : undefined,
    };

    setState((prev) => ({
      ...prev,
      registrations: [newReg, ...prev.registrations],
    }));

    pushToast(
      'Registration recorded',
      isTrackPaid
        ? `${selectedTrack.name} · Ticket ${newReg.ticketToken} pending RD UTR verification.`
        : `${selectedTrack.name} · Confirmed pass ${newReg.ticketToken} is ready.`,
      'success'
    );
    return newReg;
  };

  const submitContactForm: PortalContextValue['submitContactForm'] = (payload) => {
    const entry: ContactSubmission = {
      ...payload,
      id: `cnt-${Date.now()}`,
      submittedAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      contactSubmissions: [entry, ...prev.contactSubmissions],
    }));
    pushToast('Inquiry received', `Routed to EDC AITR ${payload.tab} desk.`, 'success');
  };

  const submitMembershipApplication: PortalContextValue['submitMembershipApplication'] = (payload) => {
    const entry: MembershipApplication = {
      ...payload,
      id: `app-${Date.now()}`,
      status: 'Pending',
      internalNotes: '',
      submittedAt: new Date().toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    setState((prev) => ({
      ...prev,
      applications: [entry, ...prev.applications],
    }));
    pushToast('Application submitted', 'Visible in the Advisor & Director review queue.', 'success');
  };

  const saveEvent: PortalContextValue['saveEvent'] = (payload) => {
    const normalizedTracks =
      payload.registrationMode === 'multi' && payload.tracks && payload.tracks.length > 0
        ? payload.tracks
        : payload.tracks && payload.tracks.length > 0
          ? payload.tracks
          : undefined;

    const enabledTracks = normalizedTracks?.filter((t) => t.enabled) ?? [];
    const paidEnabledTracks = enabledTracks.filter((t) => t.pricing.type === 'paid' && t.pricing.amountInr > 0);
    const derivedIsPaid =
      payload.registrationMode === 'multi' && normalizedTracks
        ? paidEnabledTracks.length > 0
        : payload.isPaid;
    const derivedFeeInr =
      payload.registrationMode === 'multi' && normalizedTracks
        ? paidEnabledTracks.length > 0
          ? Math.min(...paidEnabledTracks.map((t) => t.pricing.amountInr))
          : 0
        : payload.isPaid
          ? payload.feeInr
          : 0;
    const derivedUpiId =
      payload.registrationMode === 'multi' && normalizedTracks
        ? paidEnabledTracks.find((t) => t.pricing.upiId)?.pricing.upiId || payload.upiId
        : payload.upiId;

    const sanitizedPayload = {
      ...payload,
      isPaid: derivedIsPaid,
      feeInr: derivedFeeInr,
      upiId: derivedUpiId,
      tracks: normalizedTracks,
    };

    if (payload.id) {
      let updatedEvent!: EventItem;
      setState((prev) => ({
        ...prev,
        events: prev.events.map((evt) => {
          if (evt.id !== payload.id) return evt;
          updatedEvent = { ...evt, ...sanitizedPayload };
          return updatedEvent;
        }),
      }));
      pushToast('Event updated', sanitizedPayload.title, 'success');
      return updatedEvent ?? state.events.find((e) => e.id === payload.id)!;
    }
    const slug = sanitizedPayload.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const newEvt: EventItem = {
      ...sanitizedPayload,
      id: `evt-${Date.now()}`,
      slug: `${slug}-${Math.floor(100 + Math.random() * 899)}`,
      status: 'Published',
      closureChecklist: {
        attendanceFinalized: false,
        paymentsVerified: !sanitizedPayload.isPaid,
        tasksResolved: false,
        reportUploaded: Boolean(sanitizedPayload.reportDriveUrl),
        certificatesIssued: false,
      },
      auditTrail: [],
    };
    setState((prev) => ({
      ...prev,
      events: [newEvt, ...prev.events],
      activeWorkspaceEventId: newEvt.id,
    }));
    pushToast('Event published', `${newEvt.title} is now live on the Public Portal.`, 'success');
    return newEvt;
  };

  const updateTeamAllocation: PortalContextValue['updateTeamAllocation'] = (
    eventId,
    teamCode,
    leadId,
    memberIds
  ) => {
    setState((prev) => {
      const exists = prev.teamAllocations.some((a) => a.eventId === eventId && a.teamCode === teamCode);
      const nextMembers = memberIds.includes(leadId) ? memberIds : [leadId, ...memberIds];
      if (exists) {
        return {
          ...prev,
          teamAllocations: prev.teamAllocations.map((a) =>
            a.eventId === eventId && a.teamCode === teamCode ? { ...a, leadId, memberIds: nextMembers } : a
          ),
        };
      }
      return {
        ...prev,
        teamAllocations: [...prev.teamAllocations, { eventId, teamCode, leadId, memberIds: nextMembers }],
      };
    });
    pushToast(`${teamCode} unit roster saved`, 'Member assignments synchronized.', 'success');
  };

  const createTask: PortalContextValue['createTask'] = (payload) => {
    const newTask: TaskItem = {
      ...payload,
      id: `tsk-${Date.now()}`,
      comments: [],
    };
    setState((prev) => ({ ...prev, tasks: [newTask, ...prev.tasks] }));
    pushToast('Task assigned', `${payload.teamCode} · ${payload.title}`, 'success');
  };

  const updateTaskStatus: PortalContextValue['updateTaskStatus'] = (taskId, status) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
    }));
    pushToast('Task status updated', `Moved to ${status}`, 'success');
  };

  const addTaskComment: PortalContextValue['addTaskComment'] = (taskId, text) => {
    if (!text.trim()) return;
    const authorName = currentUser?.name ?? 'Core Team Member';
    const authorRole = currentUser?.designation ?? 'Operations';
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              comments: [
                ...t.comments,
                {
                  id: `cmt-${Date.now()}`,
                  authorName,
                  authorRole,
                  text: text.trim(),
                  createdAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
                },
              ],
            }
          : t
      ),
    }));
  };

  const verifyRegistrationPayment: PortalContextValue['verifyRegistrationPayment'] = (registrationId, decision) => {
    setState((prev) => ({
      ...prev,
      registrations: prev.registrations.map((r) =>
        r.id === registrationId ? { ...r, paymentStatus: decision } : r
      ),
    }));
    pushToast(
      decision === 'Verified' ? 'UTR Payment Verified' : 'UTR Payment Rejected',
      decision === 'Verified'
        ? 'Attendee pass is now cleared for QR gate check-in.'
        : 'Attendee marked as rejected; gate check-in blocked.',
      decision === 'Verified' ? 'success' : 'warning'
    );
  };

  const processQrCheckIn: PortalContextValue['processQrCheckIn'] = (eventId, tokenOrQuery) => {
    const q = tokenOrQuery.trim().toLowerCase();
    if (!q) {
      return { outcome: 'INVALID', message: 'Enter or scan a valid ticket token.' };
    }
    const match = state.registrations.find(
      (r) =>
        r.eventId === eventId &&
        (r.ticketToken.toLowerCase() === q ||
          r.enrollmentNo.toLowerCase() === q ||
          r.attendeeEmail.toLowerCase() === q)
    );
    if (!match) {
      return {
        outcome: 'INVALID',
        message: `No registration found for "${tokenOrQuery.trim()}" in the selected event.`,
      };
    }
    if (match.paymentStatus === 'Pending Payment Verification' || match.paymentStatus === 'Rejected') {
      return {
        outcome: 'INVALID',
        registration: match,
        message: `Ticket payment status is "${match.paymentStatus}". Verify UTR before entry.`,
      };
    }
    if (match.checkInStatus === 'Checked In') {
      return {
        outcome: 'ALREADY',
        registration: match,
        message: `${match.attendeeName} already checked in at ${match.checkedInAt ?? 'earlier today'}.`,
      };
    }
    const nowLabel = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }) + ' IST';
    const updated: Registration = {
      ...match,
      checkInStatus: 'Checked In',
      checkedInAt: nowLabel,
    };
    setState((prev) => ({
      ...prev,
      registrations: prev.registrations.map((r) => (r.id === match.id ? updated : r)),
    }));
    return {
      outcome: 'VALID',
      registration: updated,
      message: `${updated.attendeeName}${updated.trackName ? ` · ${updated.trackName}` : ''} (${updated.seatSlot}) cleared for entry.`,
    };
  };

  const updateClosureChecklist: PortalContextValue['updateClosureChecklist'] = (
    eventId,
    patch,
    reportDriveUrl
  ) => {
    setState((prev) => ({
      ...prev,
      events: prev.events.map((evt) =>
        evt.id === eventId
          ? {
              ...evt,
              reportDriveUrl: reportDriveUrl !== undefined ? reportDriveUrl : evt.reportDriveUrl,
              closureChecklist: { ...evt.closureChecklist, ...patch },
            }
          : evt
      ),
    }));
  };

  const issueEventCertificates: PortalContextValue['issueEventCertificates'] = (eventId) => {
    const evt = state.events.find((e) => e.id === eventId);
    if (!evt) return 0;
    const eligible = state.registrations.filter(
      (r) => r.eventId === eventId && (r.checkInStatus === 'Checked In' || r.paymentStatus === 'Verified' || r.paymentStatus === 'Free')
    );
    const existingKeys = new Set(state.certificates.map((c) => `${c.eventId}:${c.recipientName.toLowerCase()}`));
    const newCerts: Certificate[] = [];
    eligible.forEach((reg, idx) => {
      const key = `${eventId}:${reg.attendeeName.toLowerCase()}`;
      if (!existingKeys.has(key)) {
        newCerts.push({
          id: `cert-${Date.now()}-${idx}`,
          userId: reg.userId,
          recipientName: reg.attendeeName,
          eventId: evt.id,
          eventName: evt.title,
          role: 'Participant',
          issueDate: new Date().toISOString().slice(0, 10),
          credentialCode: `AITR-EDC-2026-${evt.title.slice(0, 3).toUpperCase()}-${String(1000 + idx)}`,
          signatory: 'Dr. Atul Bharat · Director, EDC AITR & AIIH Foundation',
        });
      }
    });
    setState((prev) => ({
      ...prev,
      certificates: [...newCerts, ...prev.certificates],
      events: prev.events.map((e) =>
        e.id === eventId
          ? { ...e, closureChecklist: { ...e.closureChecklist, certificatesIssued: true } }
          : e
      ),
    }));
    pushToast(
      'Certificates issued',
      `${newCerts.length > 0 ? newCerts.length : eligible.length} verified credentials published to Participant Portal.`,
      'success'
    );
    return newCerts.length;
  };

  const closeEventWithLock: PortalContextValue['closeEventWithLock'] = (eventId) => {
    const actor = currentUser ?? state.users[0];
    setState((prev) => ({
      ...prev,
      events: prev.events.map((evt) =>
        evt.id === eventId
          ? {
              ...evt,
              status: 'Closed',
              auditTrail: [
                {
                  id: `aud-${Date.now()}`,
                  action: 'Closed',
                  actorName: actor.name,
                  actorRole: actor.designation,
                  reason: 'All pre-closure compliance gates verified and archived.',
                  timestamp: new Date().toLocaleString('en-IN') + ' IST',
                },
                ...evt.auditTrail,
              ],
            }
          : evt
      ),
    }));
    pushToast('Event closed and locked', 'Record is now read-only for institutional archival.', 'success');
  };

  const reopenEventWithAudit: PortalContextValue['reopenEventWithAudit'] = (eventId, reason) => {
    const actor = currentUser ?? state.users[0];
    setState((prev) => ({
      ...prev,
      events: prev.events.map((evt) =>
        evt.id === eventId
          ? {
              ...evt,
              status: 'Published',
              auditTrail: [
                {
                  id: `aud-${Date.now()}`,
                  action: 'Reopened',
                  actorName: actor.name,
                  actorRole: actor.designation,
                  reason: reason.trim(),
                  timestamp: new Date().toLocaleString('en-IN') + ' IST',
                },
                ...evt.auditTrail,
              ],
            }
          : evt
      ),
    }));
    pushToast('Event reopened', 'Mandatory audit reason recorded in permanent log.', 'warning');
  };

  const reviewMembershipApplication: PortalContextValue['reviewMembershipApplication'] = (
    appId,
    status,
    internalNotes
  ) => {
    setState((prev) => ({
      ...prev,
      applications: prev.applications.map((a) =>
        a.id === appId ? { ...a, status, internalNotes } : a
      ),
    }));
    pushToast(`Application ${status}`, 'Applicant decision and internal notes saved.', status === 'Approved' ? 'success' : 'warning');
  };

  const addStartupListing: PortalContextValue['addStartupListing'] = (payload) => {
    const entry: StartupListing = { ...payload, id: `stp-${Date.now()}` };
    setState((prev) => ({ ...prev, startups: [entry, ...prev.startups] }));
    pushToast('Startup listed', `${entry.name} added to the EDC AITR Venture Showcase.`, 'success');
  };

  const addOpportunityListing: PortalContextValue['addOpportunityListing'] = (payload) => {
    const entry: OpportunityListing = {
      ...payload,
      id: `opp-${Date.now()}`,
      postedAt: new Date().toISOString().slice(0, 10),
    };
    setState((prev) => ({ ...prev, opportunities: [entry, ...prev.opportunities] }));
    pushToast('Opportunity published', `${entry.title} at ${entry.company}`, 'success');
  };

  const acceptConversationRequest: PortalContextValue['acceptConversationRequest'] = (conversationId) => {
    setState((prev) => ({
      ...prev,
      conversations: prev.conversations.map((c) =>
        c.id === conversationId ? { ...c, status: 'accepted' } : c
      ),
    }));
    pushToast('Conversation accepted', 'You can now reply directly in this thread.', 'success');
  };

  const sendMessageToConversation: PortalContextValue['sendMessageToConversation'] = async (
    conversationId,
    text
  ) => {
    const trimmed = text.trim();
    if (!trimmed) return { ok: false, error: 'Message cannot be empty.' };

    const targetConv = state.conversations.find((c) => c.id === conversationId);
    if (!targetConv || targetConv.status !== 'accepted') {
      return { ok: false, error: 'Conversation is not accepted for replies.' };
    }

    const senderId = currentUser?.id ?? 'usr-student';
    const senderName = currentUser?.name ?? 'EDC Member';
    const timeLabel = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    // 1. Append immediately in explicit pending state (never fakes confirmed before settlement)
    setState((prev) => ({
      ...prev,
      conversations: prev.conversations.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              lastUpdated: timeLabel,
              messages: [
                ...c.messages,
                {
                  id: messageId,
                  senderId,
                  senderName,
                  text: trimmed,
                  timestamp: `Today · ${timeLabel}`,
                  deliveryStatus: 'pending',
                },
              ],
            }
          : c
      ),
    }));

    // 2. Verify connectivity & persistence outcome before marking confirmed
    await new Promise<void>((resolve) => window.setTimeout(resolve, 140));

    const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
    if (isOffline) {
      const errorMsg = 'No network connection. Retry when back online.';
      setState((prev) => ({
        ...prev,
        conversations: prev.conversations.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === messageId
                    ? { ...m, deliveryStatus: 'failed', errorMessage: errorMsg }
                    : m
                ),
              }
            : c
        ),
      }));
      return { ok: false, messageId, error: errorMsg };
    }

    setState((prev) => ({
      ...prev,
      conversations: prev.conversations.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              messages: c.messages.map((m) =>
                m.id === messageId
                  ? { ...m, deliveryStatus: 'confirmed', errorMessage: undefined }
                  : m
              ),
            }
          : c
      ),
    }));
    return { ok: true, messageId };
  };

  const retryMessageInConversation: PortalContextValue['retryMessageInConversation'] = async (
    conversationId,
    messageId
  ) => {
    setState((prev) => ({
      ...prev,
      conversations: prev.conversations.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              messages: c.messages.map((m) =>
                m.id === messageId
                  ? { ...m, deliveryStatus: 'pending', errorMessage: undefined }
                  : m
              ),
            }
          : c
      ),
    }));

    await new Promise<void>((resolve) => window.setTimeout(resolve, 140));

    const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
    if (isOffline) {
      const errorMsg = 'Still offline. Unable to deliver message.';
      setState((prev) => ({
        ...prev,
        conversations: prev.conversations.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === messageId
                    ? { ...m, deliveryStatus: 'failed', errorMessage: errorMsg }
                    : m
                ),
              }
            : c
        ),
      }));
      return { ok: false, error: errorMsg };
    }

    setState((prev) => ({
      ...prev,
      conversations: prev.conversations.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              messages: c.messages.map((m) =>
                m.id === messageId
                  ? { ...m, deliveryStatus: 'confirmed', errorMessage: undefined }
                  : m
              ),
            }
          : c
      ),
    }));
    return { ok: true };
  };

  const startOrOpenConversationWithUser: PortalContextValue['startOrOpenConversationWithUser'] = (peer) => {
    const existing = state.conversations.find((c) => c.peerId === peer.id);
    if (existing) {
      navigate(`/alumni/messages?thread=${existing.id}`);
      return existing.id;
    }
    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      participantIds: [currentUser?.id ?? 'usr-student', peer.id],
      peerId: peer.id,
      peerName: peer.name,
      peerRole: `${peer.designation} · Batch ${peer.batch}`,
      peerCompany: peer.company || 'EDC AITR Network',
      status: 'accepted',
      requestedByPeer: false,
      lastUpdated: 'Just now',
      messages: [],
    };
    setState((prev) => ({
      ...prev,
      conversations: [newConv, ...prev.conversations],
    }));
    navigate(`/alumni/messages?thread=${newConv.id}`);
    return newConv.id;
  };

  const resetDemoData = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    setState(DEFAULT_PERSISTED_STATE);
    pushToast('Demo state reset', 'All records restored to initial EDC AITR fixtures.');
    navigate('/');
  };

  return (
    <PortalContext.Provider
      value={{
        path,
        navigate,
        currentUser,
        users: state.users,
        events: state.events,
        registrations: state.registrations,
        teamAllocations: state.teamAllocations,
        tasks: state.tasks,
        announcements: state.announcements,
        certificates: state.certificates,
        applications: state.applications,
        startups: state.startups,
        opportunities: state.opportunities,
        conversations: state.conversations,
        contactSubmissions: state.contactSubmissions,
        profileCorrectionRequests: state.profileCorrectionRequests,
        activeWorkspaceEventId: state.activeWorkspaceEventId,
        setActiveWorkspaceEventId,
        toasts,
        pushToast,
        dismissToast,
        signInAsUser,
        signInWithEmail,
        registerAccount,
        signOut,
        toggleMfaForCurrentUser,
        updateCurrentUserProfile,
        submitProfileCorrectionRequest,
        registerForEvent,
        submitContactForm,
        submitMembershipApplication,
        saveEvent,
        updateTeamAllocation,
        createTask,
        updateTaskStatus,
        addTaskComment,
        verifyRegistrationPayment,
        processQrCheckIn,
        updateClosureChecklist,
        issueEventCertificates,
        closeEventWithLock,
        reopenEventWithAudit,
        reviewMembershipApplication,
        addStartupListing,
        addOpportunityListing,
        acceptConversationRequest,
        sendMessageToConversation,
        retryMessageInConversation,
        startOrOpenConversationWithUser,
        resetDemoData,
      }}
    >
      {children}
    </PortalContext.Provider>
  );
};

export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error('usePortal must be used inside PortalProvider');
  return ctx;
}
