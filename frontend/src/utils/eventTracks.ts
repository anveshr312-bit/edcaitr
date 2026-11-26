import {
  EventItem,
  EventRegistrationTrack,
  Registration,
  RegistrationField,
  RegistrationFieldType,
  TrackCategory,
} from '../types/portal';

export interface TrackCategoryOption {
  category: TrackCategory;
  label: string;
  shortLabel: string;
  description: string;
  defaultPricingType: 'free' | 'paid';
  defaultFeeInr: number;
}

export const TRACK_CATEGORY_CATALOG: TrackCategoryOption[] = [
  {
    category: 'student',
    label: 'Students',
    shortLabel: 'Student',
    description: 'Undergraduate and postgraduate students attending sessions, workshops, or competitions.',
    defaultPricingType: 'free',
    defaultFeeInr: 0,
  },
  {
    category: 'student_exhibitor',
    label: 'Student Exhibitors',
    shortLabel: 'Exhibitor',
    description: 'Student project teams showcasing hardware prototypes, software demos, or campus stalls.',
    defaultPricingType: 'paid',
    defaultFeeInr: 250,
  },
  {
    category: 'research_scholar',
    label: 'Research Scholars / Higher Scholars',
    shortLabel: 'Research Scholar',
    description: 'M.Tech, Ph.D., and faculty researchers presenting papers, patents, or deep-tech prototypes.',
    defaultPricingType: 'paid',
    defaultFeeInr: 350,
  },
  {
    category: 'startup',
    label: 'Startups / Pitch Applicants',
    shortLabel: 'Startup Pitch',
    description: 'Registered or student-led ventures applying for investor pitches, demo stalls, or grants.',
    defaultPricingType: 'paid',
    defaultFeeInr: 799,
  },
  {
    category: 'attendee',
    label: 'General Attendees',
    shortLabel: 'General Attendee',
    description: 'Open audience pass for keynotes, fireside chats, panels, and public exhibition floor.',
    defaultPricingType: 'free',
    defaultFeeInr: 0,
  },
  {
    category: 'speaker',
    label: 'Speakers / Guests',
    shortLabel: 'Speaker / Guest',
    description: 'Invited founders, investors, mentors, jury members, and institutional dignitaries.',
    defaultPricingType: 'free',
    defaultFeeInr: 0,
  },
  {
    category: 'custom',
    label: 'Custom Category',
    shortLabel: 'Custom',
    description: 'Define a specialized participant group with bespoke eligibility, pricing, and fields.',
    defaultPricingType: 'free',
    defaultFeeInr: 0,
  },
];

export const REGISTRATION_FIELD_TYPE_OPTIONS: Array<{
  type: RegistrationFieldType;
  label: string;
  supportsOptions?: boolean;
}> = [
  { type: 'text', label: 'Short Text' },
  { type: 'textarea', label: 'Long Paragraph' },
  { type: 'email', label: 'Email Address' },
  { type: 'phone', label: 'Phone Number' },
  { type: 'number', label: 'Number' },
  { type: 'select', label: 'Dropdown Select', supportsOptions: true },
  { type: 'radio', label: 'Radio Choice', supportsOptions: true },
  { type: 'checkbox', label: 'Checkbox Confirmation' },
  { type: 'multiselect', label: 'Multi-Select Checkboxes', supportsOptions: true },
  { type: 'url', label: 'Website / Portfolio URL' },
  { type: 'file', label: 'File Upload (PDF / Deck / Image)' },
  { type: 'date', label: 'Date' },
  { type: 'institution', label: 'Institution / Organization' },
  { type: 'team_members', label: 'Team Members Roster' },
];

export function getCategoryLabel(category?: TrackCategory): string {
  const found = TRACK_CATEGORY_CATALOG.find((c) => c.category === category);
  return found ? found.shortLabel : 'General Attendee';
}

function makeField(
  id: string,
  label: string,
  type: RegistrationFieldType,
  required: boolean,
  extra?: Partial<RegistrationField>
): RegistrationField {
  return {
    id,
    label,
    type,
    required,
    visible: true,
    ...extra,
  };
}

export function createTrackFromTemplate(
  category: TrackCategory,
  options?: { existingIds?: string[]; defaultUpiId?: string; customName?: string }
): EventRegistrationTrack {
  const existing = new Set(options?.existingIds ?? []);
  const defaultUpi = options?.defaultUpiId || 'edcaitr.events@icici';
  const baseSlug = `trk-${category.replace(/_/g, '-')}`;
  let id = baseSlug;
  let counter = 2;
  while (existing.has(id)) {
    id = `${baseSlug}-${counter}`;
    counter += 1;
  }

  switch (category) {
    case 'startup':
      return {
        id,
        name: options?.customName || 'Startup / Pitch Applicant',
        description:
          'For student-led and early-stage ventures pitching to TiE MP, angel investors, and AIIH incubation panels.',
        instructions:
          'Submit a concise deck (PDF/PPTX up to 10 MB) or deck link. Shortlisted startups receive a 7-minute slot plus 3-minute jury Q&A.',
        category: 'startup',
        enabled: true,
        visible: true,
        pricing: {
          type: 'paid',
          amountInr: 799,
          feeDescription: 'Includes 2 founder passes, pitch deck review & investor lounge access',
          upiId: defaultUpi,
        },
        capacity: 30,
        eligibility: 'Registered or student-led startups with an MVP, prototype, or early pilot revenue.',
        registrationFields: [
          makeField('startup_name', 'Startup / Venture Name', 'text', true, {
            placeholder: 'e.g. KhataPulse Financial',
          }),
          makeField('founder_role', 'Founder Role & Co-Founders', 'team_members', true, {
            description: 'List primary founders or team members attending the pitch floor.',
          }),
          makeField('phone', 'Founder WhatsApp / Contact Number', 'phone', true, {
            placeholder: '+91 98260 00000',
          }),
          makeField('stage', 'Venture Stage', 'select', true, {
            options: ['Idea / Validation', 'Working Prototype / MVP', 'Early Revenue / Pilot', 'Seed Funded'],
          }),
          makeField('sector', 'Industry / Sector', 'select', true, {
            options: ['AI & Developer Tools', 'FinTech', 'EdTech', 'AgriTech / Hardware', 'SaaS / B2B', 'D2C / Consumer', 'Other'],
          }),
          makeField('website_url', 'Website or Product Demo URL', 'url', false, {
            placeholder: 'https://yourstartup.in',
          }),
          makeField('pitch_deck_file', 'Pitch Deck Upload (PDF / PPTX)', 'file', true, {
            accept: '.pdf,.ppt,.pptx',
            description: 'Max 10 MB · Stored locally in browser IndexedDB for RD & Jury review.',
          }),
          makeField('problem_summary', 'One-Paragraph Problem & Traction Summary', 'textarea', true, {
            placeholder: 'Summarize the problem solved, user validation, and key ask.',
          }),
        ],
      };

    case 'student_exhibitor':
      return {
        id,
        name: options?.customName || 'Student Exhibitor',
        description:
          'Showcase working campus prototypes, engineering models, or student-run venture booths in the Exhibition Arena.',
        instructions:
          'Tables (4×2 ft) and standard 5A power strips are allocated by the Logistics team 2 hours before gates open.',
        category: 'student_exhibitor',
        enabled: true,
        visible: true,
        pricing: {
          type: 'paid',
          amountInr: 250,
          feeDescription: 'Exhibition stall allocation for up to 3 team members',
          upiId: defaultUpi,
        },
        capacity: 40,
        eligibility: 'Students from AITR or partner colleges with a live project, prototype, or product demo.',
        registrationFields: [
          makeField('institution', 'Institution / College Name', 'institution', true, {
            placeholder: 'Acropolis Institute of Technology & Research, Indore',
          }),
          makeField('department_year', 'Department & Year', 'text', true, {
            placeholder: 'B.Tech CSE · 3rd Year',
          }),
          makeField('phone', 'Team Lead Phone Number', 'phone', true, {
            placeholder: '+91 98260 00000',
          }),
          makeField('project_title', 'Project / Exhibit Title', 'text', true, {
            placeholder: 'Autonomous Solar Soil Telemetry Node',
          }),
          makeField('project_summary', 'Project Description', 'textarea', true, {
            placeholder: 'Explain what visitors will see or interact with at your booth.',
          }),
          makeField('team_members', 'Exhibiting Team Members', 'team_members', true, {
            description: 'Add co-exhibitors who require exhibitor badges.',
          }),
          makeField('power_hardware', 'Power / Hardware / Stall Requirements', 'multiselect', false, {
            options: [
              '220V Power Socket',
              'Display Monitor / HDMI Desk Space',
              'High-Speed Wi-Fi Access',
              'Extra Demo Table Space',
            ],
          }),
        ],
      };

    case 'research_scholar':
      return {
        id,
        name: options?.customName || 'Research Scholar',
        description:
          'Dedicated academic & R&D track for postgraduate scholars, Ph.D. candidates, and patent-stage innovators.',
        instructions:
          'Upload a brief abstract or supporting research note for technical track review.',
        category: 'research_scholar',
        enabled: true,
        visible: true,
        pricing: {
          type: 'paid',
          amountInr: 350,
          feeDescription: 'Includes research colloquium access, abstract proceedings & scholar badge',
          upiId: defaultUpi,
        },
        capacity: 50,
        eligibility: 'M.Tech, Ph.D., post-doctoral scholars, and institutional research fellows.',
        registrationFields: [
          makeField('institution', 'University / Research Institution', 'institution', true, {
            placeholder: 'IIT Indore / AITR / DAVV',
          }),
          makeField('department', 'Department / Lab Affiliation', 'text', true, {
            placeholder: 'Department of Computer Science & Engineering',
          }),
          makeField('designation', 'Scholar Level', 'radio', true, {
            options: ['M.Tech / PG Scholar', 'Ph.D. Research Scholar', 'Faculty Researcher', 'Industry R&D Fellow'],
          }),
          makeField('research_area', 'Primary Research Domain', 'text', true, {
            placeholder: 'Applied Machine Learning / Clean Energy Storage',
          }),
          makeField('research_abstract', 'Research Abstract / Commercialization Note', 'textarea', true, {
            placeholder: '150–250 word overview of your research contribution and translational potential.',
          }),
          makeField('supporting_doc', 'Supporting Paper / Abstract Document (Optional)', 'file', false, {
            accept: '.pdf,.doc,.docx',
            description: 'Optional PDF or DOCX (max 10 MB).',
          }),
        ],
      };

    case 'student':
      return {
        id,
        name: options?.customName || 'Student Participant',
        description:
          'For university & college students attending keynotes, founder dialogues, and campus workshops.',
        instructions: 'Carry your college ID card along with your digital EDC pass QR at the registration desk.',
        category: 'student',
        enabled: true,
        visible: true,
        pricing: {
          type: 'free',
          amountInr: 0,
          feeDescription: 'Complimentary student delegate entry',
        },
        capacity: 250,
        eligibility: 'All undergraduate and postgraduate students with a valid institutional ID.',
        registrationFields: [
          makeField('institution', 'College / Institution', 'institution', true, {
            placeholder: 'Acropolis Institute of Technology & Research',
          }),
          makeField('branch_year', 'Branch & Semester / Year', 'text', true, {
            placeholder: 'B.Tech CSE · 6th Sem',
          }),
          makeField('phone', 'Phone Number', 'phone', true, {
            placeholder: '+91 98260 00000',
          }),
          makeField('interest_area', 'Primary Session Interest', 'select', false, {
            options: ['Startup Building & CSI', 'Product & Engineering', 'Investor Panels', 'Campus Hackathon'],
          }),
        ],
      };

    case 'speaker':
      return {
        id,
        name: options?.customName || 'Speaker / Invited Guest',
        description:
          'Protocol registration for invited speakers, mentors, jury members, and institutional partners.',
        instructions: 'Our Guest Coordination team will confirm arrival hospitality and AV requirements.',
        category: 'speaker',
        enabled: true,
        visible: true,
        pricing: {
          type: 'free',
          amountInr: 0,
          feeDescription: 'Complimentary VIP & Guest hospitality pass',
        },
        capacity: 25,
        eligibility: 'Invited speakers, startup mentors, investors, and academic dignitaries.',
        registrationFields: [
          makeField('organization', 'Organization & Designation', 'institution', true, {
            placeholder: 'Founder, Company Name / Partner, Venture Desk',
          }),
          makeField('phone', 'Direct Contact / Coordinator Phone', 'phone', true, {
            placeholder: '+91 98260 00000',
          }),
          makeField('session_role', 'Participation Role', 'select', true, {
            options: ['Keynote Speaker', 'Panelist', 'Pitch Jury / Investor', 'Mentor', 'Institutional Guest'],
          }),
          makeField('linkedin_url', 'LinkedIn Profile URL', 'url', false, {
            placeholder: 'https://linkedin.com/in/...',
          }),
          makeField('av_notes', 'Presentation / AV Notes', 'textarea', false, {
            placeholder: 'HDMI adapter, clicker, or arrival timing preferences.',
          }),
        ],
      };

    case 'custom':
      return {
        id,
        name: options?.customName || 'Custom Participant Track',
        description: 'Custom participant category configured by the organizing team.',
        instructions: '',
        category: 'custom',
        enabled: true,
        visible: true,
        pricing: {
          type: 'free',
          amountInr: 0,
          feeDescription: '',
        },
        capacity: 100,
        eligibility: 'Open to eligible participants approved under this category.',
        registrationFields: [
          makeField('organization', 'Institution / Organization', 'institution', true, {
            placeholder: 'Organization or institution name',
          }),
          makeField('phone', 'Contact Number', 'phone', true, {
            placeholder: '+91 98260 00000',
          }),
          makeField('notes', 'Additional Details', 'textarea', false, {
            placeholder: 'Share relevant context for the organizing team.',
          }),
        ],
      };

    case 'attendee':
    default:
      return {
        id,
        name: options?.customName || 'General Attendee',
        description: 'Open delegate pass for keynotes, fireside conversations, and the public expo floor.',
        instructions: 'Registration is quick and takes under 30 seconds.',
        category: 'attendee',
        enabled: true,
        visible: true,
        pricing: {
          type: 'free',
          amountInr: 0,
          feeDescription: 'Standard open audience pass',
        },
        capacity: 200,
        eligibility: 'Open to students, working professionals, founders, and ecosystem enthusiasts.',
        registrationFields: [
          makeField('organization', 'Institution / Organization', 'institution', false, {
            placeholder: 'College, startup, or company name',
          }),
          makeField('phone', 'Phone Number', 'phone', true, {
            placeholder: '+91 98260 00000',
          }),
        ],
      };
  }
}

/**
 * Normalizes any EventItem (legacy single-track OR new multi-track) into an effective
 * list of EventRegistrationTrack objects without mutating or breaking legacy event data.
 */
export function getEffectiveTracks(event: EventItem): EventRegistrationTrack[] {
  if (event.tracks && event.tracks.length > 0) {
    return event.tracks;
  }

  return [
    {
      id: `default-${event.id}`,
      name: 'General Attendee',
      description: event.subtitle || 'Standard event participant registration.',
      category: 'attendee',
      enabled: event.status === 'Published',
      visible: true,
      pricing: {
        type: event.isPaid ? 'paid' : 'free',
        amountInr: event.isPaid ? event.feeInr : 0,
        feeDescription: event.isPaid ? 'Standard event registration fee' : 'Complimentary registration',
        upiId: event.upiId || undefined,
      },
      capacity: event.capacity,
      eligibility: 'Open to eligible campus and regional participants.',
      registrationFields: [],
    },
  ];
}

export function isMultiTrackEvent(event: EventItem): boolean {
  if (event.registrationMode === 'multi') {
    return Boolean(event.tracks && event.tracks.length > 0);
  }
  return Boolean(event.tracks && event.tracks.length > 1);
}

export function getActiveTrackPrice(track: EventRegistrationTrack, now: Date = new Date()): {
  amountInr: number;
  isEarlyBird: boolean;
} {
  if (track.pricing.type === 'free') {
    return { amountInr: 0, isEarlyBird: false };
  }
  if (
    track.pricing.earlyBirdAmountInr !== undefined &&
    track.pricing.earlyBirdAmountInr >= 0 &&
    track.pricing.earlyBirdDeadline
  ) {
    const deadline = new Date(`${track.pricing.earlyBirdDeadline}T23:59:59`);
    if (!Number.isNaN(deadline.getTime()) && now <= deadline) {
      return { amountInr: track.pricing.earlyBirdAmountInr, isEarlyBird: true };
    }
  }
  return { amountInr: Math.max(0, Number(track.pricing.amountInr) || 0), isEarlyBird: false };
}

export interface TrackAvailability {
  registeredCount: number;
  remainingSeats: number | null; // null = unlimited
  isFull: boolean;
  isEventFull: boolean;
  isBeforeOpen: boolean;
  isAfterClose: boolean;
  isDisabled: boolean;
  isEventClosed: boolean;
  canRegister: boolean;
  statusLabel: string;
  statusTone: 'green' | 'amber' | 'crimson' | 'neutral';
}

export function getTrackAvailability(
  event: EventItem,
  track: EventRegistrationTrack,
  registrations: Registration[],
  now: Date = new Date()
): TrackAvailability {
  const eventRegs = registrations.filter(
    (r) => r.eventId === event.id && r.paymentStatus !== 'Rejected'
  );
  const trackRegs = eventRegs.filter(
    (r) => r.trackId === track.id || (!r.trackId && track.id === `default-${event.id}`)
  );
  const registeredCount = trackRegs.length;

  const isEventClosed = event.status === 'Closed';
  const isDisabled = !track.enabled || track.visible === false;

  const isBeforeOpen = Boolean(
    track.registrationOpensAt && now < new Date(`${track.registrationOpensAt}T00:00:00`)
  );
  const isAfterClose = Boolean(
    track.registrationClosesAt && now > new Date(`${track.registrationClosesAt}T23:59:59`)
  );

  const eventRemaining =
    event.capacity === null ? null : Math.max(0, event.capacity - eventRegs.length);
  const isEventFull = eventRemaining !== null && eventRemaining <= 0;

  const trackRemaining =
    track.capacity === null ? null : Math.max(0, track.capacity - registeredCount);
  const isTrackFull = trackRemaining !== null && trackRemaining <= 0;

  // Effective remaining seats is constrained by both track capacity and overall event capacity
  let remainingSeats: number | null = trackRemaining;
  if (eventRemaining !== null) {
    remainingSeats =
      remainingSeats === null ? eventRemaining : Math.min(remainingSeats, eventRemaining);
  }

  const isFull = isTrackFull || isEventFull;
  const canRegister = !isEventClosed && !isDisabled && !isBeforeOpen && !isAfterClose && !isFull;

  let statusLabel = 'Open';
  let statusTone: TrackAvailability['statusTone'] = 'green';
  if (isEventClosed) {
    statusLabel = 'Event Closed';
    statusTone = 'neutral';
  } else if (isDisabled) {
    statusLabel = 'Disabled';
    statusTone = 'neutral';
  } else if (isBeforeOpen) {
    statusLabel = `Opens ${track.registrationOpensAt}`;
    statusTone = 'amber';
  } else if (isAfterClose) {
    statusLabel = 'Window Closed';
    statusTone = 'neutral';
  } else if (isFull) {
    statusLabel = 'Capacity Reached';
    statusTone = 'crimson';
  } else if (remainingSeats !== null && remainingSeats <= 10) {
    statusLabel = `${remainingSeats} seats left`;
    statusTone = 'amber';
  }

  return {
    registeredCount,
    remainingSeats,
    isFull,
    isEventFull,
    isBeforeOpen,
    isAfterClose,
    isDisabled,
    isEventClosed,
    canRegister,
    statusLabel,
    statusTone,
  };
}

export interface EventPricingSummary {
  label: string;
  isMultiTrack: boolean;
  enabledTrackCount: number;
  openTrackCount: number;
  hasFree: boolean;
  hasPaid: boolean;
  lowestPaidInr: number | null;
  trackNamesPreview: string[];
}

export function getEventPricingSummary(
  event: EventItem,
  registrations: Registration[]
): EventPricingSummary {
  const tracks = getEffectiveTracks(event);
  const multi = isMultiTrackEvent(event);
  const visibleEnabled = tracks.filter((t) => t.enabled && t.visible !== false);
  const openTracks = visibleEnabled.filter(
    (t) => getTrackAvailability(event, t, registrations).canRegister
  );

  const source = openTracks.length > 0 ? openTracks : visibleEnabled;
  const hasFree = source.some((t) => t.pricing.type === 'free');
  const paidAmounts = source
    .filter((t) => t.pricing.type === 'paid')
    .map((t) => getActiveTrackPrice(t).amountInr);
  const hasPaid = paidAmounts.length > 0;
  const lowestPaidInr = hasPaid ? Math.min(...paidAmounts) : null;

  let label = 'Free';
  if (event.status === 'Closed' || visibleEnabled.length === 0) {
    label = 'Registrations Closed';
  } else if (hasFree && hasPaid) {
    label = 'Free & Paid Options';
  } else if (hasPaid && lowestPaidInr !== null) {
    const uniquePrices = new Set(paidAmounts);
    label = uniquePrices.size > 1 ? `From ₹${lowestPaidInr}` : `₹${lowestPaidInr}`;
  } else {
    label = 'Free';
  }

  return {
    label,
    isMultiTrack: multi,
    enabledTrackCount: visibleEnabled.length,
    openTrackCount: openTracks.length,
    hasFree,
    hasPaid,
    lowestPaidInr,
    trackNamesPreview: visibleEnabled.slice(0, 3).map((t) => t.name),
  };
}

export interface TrackValidationResult {
  status: 'Configured' | 'Needs configuration' | 'Registration disabled' | 'Capacity reached';
  tone: 'green' | 'amber' | 'neutral' | 'crimson';
  issues: string[];
}

export function validateTrackForBuilder(
  track: EventRegistrationTrack,
  allTracks: EventRegistrationTrack[],
  registeredCount = 0
): TrackValidationResult {
  const issues: string[] = [];

  if (!track.name.trim()) {
    issues.push('Category name is required.');
  }
  const duplicateIdCount = allTracks.filter((t) => t.id === track.id).length;
  if (duplicateIdCount > 1) {
    issues.push('Duplicate track identifier detected.');
  }
  if (track.capacity !== null && (Number.isNaN(track.capacity) || track.capacity < 1)) {
    issues.push('Capacity must be a positive number or left unlimited.');
  }
  if (track.pricing.type === 'paid') {
    if (Number.isNaN(track.pricing.amountInr) || track.pricing.amountInr <= 0) {
      issues.push('Paid track requires a positive registration fee (INR).');
    }
    if (!track.pricing.upiId || !track.pricing.upiId.trim()) {
      issues.push('Paid track requires a UPI ID for fee collection.');
    }
    if (
      track.pricing.earlyBirdAmountInr !== undefined &&
      track.pricing.earlyBirdAmountInr < 0
    ) {
      issues.push('Early-bird fee cannot be negative.');
    }
  }
  if (
    track.registrationOpensAt &&
    track.registrationClosesAt &&
    track.registrationOpensAt > track.registrationClosesAt
  ) {
    issues.push('Registration close date must be on or after the open date.');
  }

  const invalidOptionField = track.registrationFields.find(
    (f) =>
      f.visible !== false &&
      (f.type === 'select' || f.type === 'radio' || f.type === 'multiselect') &&
      (!f.options || f.options.filter((o) => o.trim()).length === 0)
  );
  if (invalidOptionField) {
    issues.push(`Field "${invalidOptionField.label || 'Untitled'}" needs at least one option.`);
  }

  const untitledField = track.registrationFields.find(
    (f) => f.visible !== false && !f.label.trim()
  );
  if (untitledField) {
    issues.push('Every active form field must have a label.');
  }

  if (!track.enabled) {
    return { status: 'Registration disabled', tone: 'neutral', issues };
  }
  if (issues.length > 0) {
    return { status: 'Needs configuration', tone: 'amber', issues };
  }
  if (track.capacity !== null && registeredCount >= track.capacity) {
    return { status: 'Capacity reached', tone: 'crimson', issues: [] };
  }
  return { status: 'Configured', tone: 'green', issues: [] };
}

/**
 * Formats a registration's submitted custom field value into readable text for UI & CSV exports.
 */
export function formatRegistrationAnswer(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value).trim() || '—';
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '—';
    if (typeof value[0] === 'string') {
      return (value as string[]).join(', ');
    }
    return (value as Array<{ name: string; email?: string; role?: string }>)
      .map((m) => [m.name, m.role ? `(${m.role})` : '', m.email ? `<${m.email}>` : ''].filter(Boolean).join(' '))
      .join('; ');
  }
  if (typeof value === 'object' && 'assetRef' in (value as Record<string, unknown>)) {
    const file = value as { name?: string; size?: number };
    return file.name ? `${file.name}` : 'Attached file';
  }
  return String(value);
}
