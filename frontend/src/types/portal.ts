export type UserRole = 'participant' | 'core_team' | 'advisor' | 'director' | 'alumni';

export type OperationalTeamCode =
  | 'RD'
  | 'AV'
  | 'STAGE'
  | 'LOGISTICS'
  | 'CROWD'
  | 'CLIX'
  | 'GUEST'
  | 'DOCS'
  | 'ANCHORING'
  | 'DESIGN'
  | 'VIDEO'
  | 'SOCIAL';

export type ProfileVisibilityLevel = 'private' | 'edc_members' | 'public';
export type FieldVisibilitySetting = 'private' | 'edc_members' | 'public';

export interface ProfileFieldVisibility {
  fullName: FieldVisibilitySetting;
  avatar: FieldVisibilitySetting;
  designation: FieldVisibilitySetting;
  department: FieldVisibilitySetting;
  bio: FieldVisibilitySetting;
  linkedin: FieldVisibilitySetting;
  phone: FieldVisibilitySetting;
  email: FieldVisibilitySetting;
  company: FieldVisibilitySetting;
  startup: FieldVisibilitySetting;
  links: FieldVisibilitySetting;
}

export interface AvatarMeta {
  name: string;
  mimeType: string;
  width: number;
  height: number;
  size: number;
  storageMode: 'browser_indexeddb' | 'static_asset';
}

export interface ProfileCorrectionRequest {
  id: string;
  userId: string;
  userName: string;
  currentRole: UserRole;
  field: 'role' | 'designation' | 'operationalTeam' | 'tenure' | 'email' | 'verification';
  currentValue: string;
  requestedValue: string;
  reason: string;
  status: 'Pending' | 'Reviewed';
  submittedAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  preferredName?: string;
  email: string;
  role: UserRole;
  designation: string;
  department: string;
  operationalTeam?: OperationalTeamCode;
  batch: string;
  city: string;
  industry: string;
  startupStage?: 'Idea' | 'Pre-Seed' | 'Bootstrapped' | 'Seed' | 'Series A' | 'None';
  company?: string;
  pastEdcRole?: string;
  linkedin: string;
  tenure: 'current' | 'past';
  mfaEnabled: boolean;
  phone?: string;
  // Identity Studio extensions (all optional for full backward compatibility)
  verified?: boolean;
  bio?: string;
  avatarUrl?: string; // `idb://...` or static URL
  avatarPosition?: string; // CSS object-position e.g. '50% 50%'
  avatarMeta?: AvatarMeta;
  websiteUrl?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  skills?: string[];
  interests?: string[];
  // Director fields
  leadershipIntro?: string;
  institutionalResponsibilities?: string[];
  professionalBackground?: string;
  experienceSummary?: string;
  publicAchievements?: string[];
  // Core Team fields
  teamPosition?: string;
  areasOfResponsibility?: string[];
  // Advisor fields
  expertiseDomains?: string[];
  mentorshipAreas?: string[];
  // Alumni fields
  startupName?: string;
  companyWebsite?: string;
  openToMentorship?: boolean;
  mentorshipDomains?: string[];
  // Participant fields
  college?: string;
  course?: string;
  academicYear?: string;
  personalProjects?: string;
  startupInterests?: string;
  // Privacy & Visibility
  profileVisibility?: ProfileVisibilityLevel;
  fieldVisibility?: Partial<ProfileFieldVisibility>;
  updatedAt?: string;
}

export type EventCategory = 'Conclaves' | 'Hackathons' | 'Bootcamps';

export interface EventSpeaker {
  name: string;
  role: string;
  organization: string;
  topic: string;
}

export interface AuditEntry {
  id: string;
  action: 'Closed' | 'Reopened';
  actorName: string;
  actorRole: string;
  reason: string;
  timestamp: string;
}

export interface EventClosureChecklist {
  attendanceFinalized: boolean;
  paymentsVerified: boolean;
  tasksResolved: boolean;
  reportUploaded: boolean;
  certificatesIssued: boolean;
}

export type TrackCategory =
  | 'student'
  | 'student_exhibitor'
  | 'research_scholar'
  | 'startup'
  | 'attendee'
  | 'speaker'
  | 'custom';

export type RegistrationFieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'phone'
  | 'number'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'multiselect'
  | 'url'
  | 'file'
  | 'date'
  | 'institution'
  | 'team_members';

export interface RegistrationField {
  id: string;
  label: string;
  type: RegistrationFieldType;
  required: boolean;
  options?: string[];
  placeholder?: string;
  description?: string;
  visible?: boolean;
  accept?: string;
}

export interface TrackPricingConfig {
  type: 'free' | 'paid';
  amountInr: number;
  earlyBirdAmountInr?: number;
  earlyBirdDeadline?: string;
  feeDescription?: string;
  upiId?: string;
}

export interface EventRegistrationTrack {
  id: string;
  name: string;
  description: string;
  instructions?: string;
  category: TrackCategory;
  enabled: boolean;
  visible?: boolean;
  pricing: TrackPricingConfig;
  capacity: number | null; // null = unlimited
  eligibility: string;
  registrationOpensAt?: string;
  registrationClosesAt?: string;
  registrationFields: RegistrationField[];
}

export interface EventThumbnailMeta {
  name: string;
  mimeType: string;
  width: number;
  height: number;
  size: number;
  storageMode: 'browser_indexeddb' | 'static_asset';
}

export interface UploadedFileRef {
  assetRef: string; // idb://<assetId>
  name: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  storageMode: 'browser_indexeddb';
}

export interface TeamMemberEntry {
  name: string;
  email?: string;
  role?: string;
}

export type RegistrationFieldAnswerValue =
  | string
  | number
  | boolean
  | string[]
  | UploadedFileRef
  | TeamMemberEntry[];

export interface RegistrationFieldResponse {
  fieldId: string;
  label: string;
  type: RegistrationFieldType;
  value: RegistrationFieldAnswerValue;
}

export interface EventItem {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: EventCategory;
  startDate: string;
  endDate: string;
  dateLabel: string;
  venue: string;
  description: string;
  capacity: number | null; // null = unlimited
  isPaid: boolean;
  feeInr: number;
  upiId: string;
  qrPreviewLabel?: string;
  spocPrimaryId: string;
  spocSecondaryId: string;
  speakers: EventSpeaker[];
  bannerImage: string;
  bannerAlt?: string;
  bannerPosition?: string; // CSS object-position e.g. '50% 50%'
  thumbnailMeta?: EventThumbnailMeta;
  registrationMode?: 'single' | 'multi';
  tracks?: EventRegistrationTrack[];
  status: 'Published' | 'Closed';
  reportDriveUrl: string;
  closureChecklist: EventClosureChecklist;
  auditTrail: AuditEntry[];
}

export type PaymentStatus = 'Free' | 'Pending Payment Verification' | 'Verified' | 'Rejected';
export type CheckInStatus = 'Not Checked In' | 'Checked In';

export interface Registration {
  id: string;
  eventId: string;
  userId: string;
  attendeeName: string;
  attendeeEmail: string;
  enrollmentNo: string;
  ticketToken: string;
  paymentStatus: PaymentStatus;
  utrNumber?: string;
  checkInStatus: CheckInStatus;
  checkedInAt?: string;
  seatSlot: string;
  registeredAt: string;
  // Event Builder 2.0 multi-track metadata (optional for full legacy compatibility)
  trackId?: string;
  trackName?: string;
  trackCategory?: TrackCategory;
  amountInr?: number;
  pricingSnapshot?: {
    type: 'free' | 'paid';
    amountInr: number;
    upiId?: string;
    feeDescription?: string;
  };
  formResponses?: Record<string, RegistrationFieldResponse>;
}

export interface TeamAllocation {
  eventId: string;
  teamCode: OperationalTeamCode;
  leadId: string;
  memberIds: string[];
}

export type TaskStatus = 'To Do' | 'In Progress' | 'Submitted' | 'Approved' | 'Changes Requested';

export interface TaskComment {
  id: string;
  authorName: string;
  authorRole: string;
  text: string;
  createdAt: string;
}

export interface TaskItem {
  id: string;
  eventId: string;
  title: string;
  brief: string;
  teamCode: OperationalTeamCode;
  assigneeId: string;
  deadline: string;
  status: TaskStatus;
  attachmentUrl?: string;
  comments: TaskComment[];
}

export type AnnouncementCategory = 'Urgent' | 'Conclave' | 'General';

export interface Announcement {
  id: string;
  title: string;
  category: AnnouncementCategory;
  date: string;
  author: string;
  summary: string;
  body: string;
  attachmentName?: string;
  attachmentSize?: string;
}

export interface Certificate {
  id: string;
  userId: string;
  recipientName: string;
  eventId: string;
  eventName: string;
  role: 'Participant' | 'Winner' | 'Organizer';
  issueDate: string;
  credentialCode: string;
  signatory: string;
}

export interface MembershipApplication {
  id: string;
  applicantName: string;
  email: string;
  enrollmentNo: string;
  branchYear: string;
  preferredTeam: OperationalTeamCode;
  secondaryTeam: OperationalTeamCode;
  portfolioUrl: string;
  statement: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  internalNotes: string;
  submittedAt: string;
}

export interface StartupListing {
  id: string;
  name: string;
  tagline: string;
  founderName: string;
  founderBatch: string;
  industry: 'Fintech' | 'EdTech' | 'D2C' | 'SaaS' | 'AI';
  fundingStage: 'Bootstrapped' | 'Seed' | 'Series A';
  pitchDeckUrl: string;
  websiteUrl: string;
  city: string;
  description: string;
}

export interface OpportunityListing {
  id: string;
  title: string;
  company: string;
  postedBy: string;
  type: 'Full-time' | 'Internship' | 'Co-Founder equity';
  location: 'Indore' | 'Bangalore' | 'Remote';
  compensation: string;
  contactEmail: string;
  description: string;
  postedAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  deliveryStatus?: 'pending' | 'confirmed' | 'failed';
  errorMessage?: string;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  peerId: string;
  peerName: string;
  peerRole: string;
  peerCompany: string;
  status: 'pending_request' | 'accepted';
  requestedByPeer: boolean;
  lastUpdated: string;
  messages: ChatMessage[];
}

export interface ContactSubmission {
  id: string;
  tab: 'General Inquiry' | 'Startup Incubation & CSI' | 'Conclave Sponsorship & Partnerships';
  name: string;
  email: string;
  organization: string;
  message: string;
  submittedAt: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  detail?: string;
  tone?: 'default' | 'success' | 'warning' | 'error';
  durationMs?: number;
  createdAt?: number;
}
