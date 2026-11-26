'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  Briefcase,
  Building2,
  Check,
  Copy,
  Edit3,
  Eye,
  FileEdit,
  Globe,
  GraduationCap,
  KeyRound,
  Link2,
  Lock,
  LogOut,
  Plus,
  Save,
  Shield,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  X,
} from 'lucide-react';
import { usePortal } from '../../context/PortalContext';
import {
  FieldVisibilitySetting,
  ProfileCorrectionRequest,
  ProfileFieldVisibility,
  ProfileVisibilityLevel,
  UserProfile,
} from '../../types/portal';
import {
  calculateProfileCompletion,
  DEFAULT_FIELD_VISIBILITY,
  getEffectiveFieldVisibility,
  getEffectiveProfileVisibility,
  getProjectedMemberProfile,
  getPublicProfilePath,
  getRoleLabel,
  IdentitySectionId,
  isOfficialDesignationProtected,
  normalizeUrlInput,
} from '../../utils/identityProfile';
import { ModalDialog, StudioButton } from '../../components/ui/Primitives';
import { MemberAvatar } from '../../components/identity/MemberAvatar';
import { AvatarUploader } from '../../components/identity/AvatarUploader';
import { IdentityCredentialCard } from '../../components/identity/IdentityCredentialCard';

interface SectionDef {
  id: IdentitySectionId;
  index: string;
  label: string;
  shortLabel: string;
  icon: React.FC<{ className?: string }>;
}

const SECTIONS: SectionDef[] = [
  { id: 'personal', index: '01', label: 'Personal Information', shortLabel: 'Personal', icon: User },
  { id: 'affiliation', index: '02', label: 'EDC Affiliation', shortLabel: 'Affiliation', icon: Building2 },
  { id: 'professional', index: '03', label: 'Professional Identity', shortLabel: 'Professional', icon: Briefcase },
  { id: 'skills', index: '04', label: 'Skills & Interests', shortLabel: 'Skills', icon: Sparkles },
  { id: 'links', index: '05', label: 'Social & Portfolio Links', shortLabel: 'Links', icon: Link2 },
  { id: 'privacy', index: '06', label: 'Privacy & Visibility', shortLabel: 'Privacy', icon: Eye },
  { id: 'security', index: '07', label: 'Account Security', shortLabel: 'Security', icon: Shield },
];

const FIELD_VISIBILITY_ROWS: Array<{
  key: keyof ProfileFieldVisibility;
  label: string;
  hint: string;
  allowPublic: boolean;
}> = [
  { key: 'fullName', label: 'Full Name', hint: 'Displayed on your member header and directory entry', allowPublic: true },
  { key: 'avatar', label: 'Profile Photograph', hint: 'Square portrait shown on identity card and profile', allowPublic: true },
  { key: 'designation', label: 'Official Designation', hint: 'Your institutional title or current role', allowPublic: true },
  { key: 'department', label: 'Department / Batch', hint: 'Academic branch, graduation cohort, or governance unit', allowPublic: true },
  { key: 'bio', label: 'Biography & Narrative', hint: 'Short introduction and role summary', allowPublic: true },
  { key: 'company', label: 'Company & Industry', hint: 'Current organization and sector', allowPublic: true },
  { key: 'startup', label: 'Startup / Venture Info', hint: 'Venture name, stage, and startup interests', allowPublic: true },
  { key: 'linkedin', label: 'LinkedIn Profile', hint: 'External LinkedIn link', allowPublic: true },
  { key: 'links', label: 'Website, Portfolio & GitHub', hint: 'Additional external links', allowPublic: true },
  { key: 'email', label: 'Institutional Email', hint: 'Never shown on public profiles; optional for EDC members', allowPublic: false },
  { key: 'phone', label: 'Phone Number', hint: 'Private by default; never shown on public profiles', allowPublic: false },
];

const STARTUP_STAGES: Array<NonNullable<UserProfile['startupStage']>> = [
  'None',
  'Idea',
  'Pre-Seed',
  'Bootstrapped',
  'Seed',
  'Series A',
];

interface DraftState {
  name: string;
  preferredName: string;
  bio: string;
  city: string;
  phone: string;
  department: string;
  batch: string;
  designation: string;
  pastEdcRole: string;
  teamPosition: string;
  company: string;
  industry: string;
  startupName: string;
  startupStage: NonNullable<UserProfile['startupStage']>;
  companyWebsite: string;
  openToMentorship: boolean;
  mentorshipDomains: string[];
  leadershipIntro: string;
  institutionalResponsibilities: string[];
  professionalBackground: string;
  experienceSummary: string;
  publicAchievements: string[];
  areasOfResponsibility: string[];
  expertiseDomains: string[];
  mentorshipAreas: string[];
  college: string;
  course: string;
  academicYear: string;
  personalProjects: string;
  startupInterests: string;
  skills: string[];
  interests: string[];
  linkedin: string;
  websiteUrl: string;
  portfolioUrl: string;
  githubUrl: string;
  avatarUrl?: string;
  avatarPosition: string;
  avatarMeta?: UserProfile['avatarMeta'];
  profileVisibility: ProfileVisibilityLevel;
  fieldVisibility: ProfileFieldVisibility;
}

function buildDraftFromUser(user: UserProfile): DraftState {
  return {
    name: user.name ?? '',
    preferredName: user.preferredName ?? '',
    bio: user.bio ?? '',
    city: user.city ?? '',
    phone: user.phone ?? '',
    department: user.department ?? '',
    batch: user.batch ?? '',
    designation: user.designation ?? '',
    pastEdcRole: user.pastEdcRole ?? '',
    teamPosition: user.teamPosition ?? '',
    company: user.company ?? '',
    industry: user.industry ?? '',
    startupName: user.startupName ?? '',
    startupStage: user.startupStage ?? 'None',
    companyWebsite: user.companyWebsite ?? '',
    openToMentorship: Boolean(user.openToMentorship),
    mentorshipDomains: [...(user.mentorshipDomains ?? [])],
    leadershipIntro: user.leadershipIntro ?? '',
    institutionalResponsibilities: [...(user.institutionalResponsibilities ?? [])],
    professionalBackground: user.professionalBackground ?? '',
    experienceSummary: user.experienceSummary ?? '',
    publicAchievements: [...(user.publicAchievements ?? [])],
    areasOfResponsibility: [...(user.areasOfResponsibility ?? [])],
    expertiseDomains: [...(user.expertiseDomains ?? [])],
    mentorshipAreas: [...(user.mentorshipAreas ?? [])],
    college: user.college ?? '',
    course: user.course ?? '',
    academicYear: user.academicYear ?? '',
    personalProjects: user.personalProjects ?? '',
    startupInterests: user.startupInterests ?? '',
    skills: [...(user.skills ?? [])],
    interests: [...(user.interests ?? [])],
    linkedin: user.linkedin === 'https://linkedin.com' ? '' : user.linkedin ?? '',
    websiteUrl: user.websiteUrl ?? '',
    portfolioUrl: user.portfolioUrl ?? '',
    githubUrl: user.githubUrl ?? '',
    avatarUrl: user.avatarUrl,
    avatarPosition: user.avatarPosition ?? '50% 50%',
    avatarMeta: user.avatarMeta,
    profileVisibility: getEffectiveProfileVisibility(user),
    fieldVisibility: getEffectiveFieldVisibility(user),
  };
}

const TagEditor: React.FC<{
  label: string;
  hint?: string;
  items: string[];
  placeholder: string;
  editable: boolean;
  onChange: (next: string[]) => void;
}> = ({ label, hint, items, placeholder, editable, onChange }) => {
  const [inputValue, setInputValue] = useState('');

  const addTag = () => {
    const cleaned = inputValue.trim().slice(0, 64);
    if (!cleaned) return;
    if (items.some((t) => t.toLowerCase() === cleaned.toLowerCase())) {
      setInputValue('');
      return;
    }
    onChange([...items, cleaned].slice(0, 20));
    setInputValue('');
  };

  return (
    <div className="space-y-2.5">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--ink-muted)]">
          {label}
        </label>
        {hint && <p className="text-xs text-[var(--ink-muted)] mt-0.5">{hint}</p>}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-[var(--ink-muted)] italic">
          {editable ? 'No items added yet. Type below and press Enter.' : 'Not added yet.'}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-medium bg-[var(--surface-subtle)] border border-[var(--border-hairline)] text-[var(--color-2-mood)]"
            >
              <span>{item}</span>
              {editable && (
                <button
                  type="button"
                  onClick={() => onChange(items.filter((t) => t !== item))}
                  aria-label={`Remove ${item}`}
                  className="text-[var(--ink-muted)] hover:text-[#C01E30] cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {editable && (
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 text-sm rounded-[8px] bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--color-2-mood)] focus:outline-none focus:border-[#C01E30]"
          />
          <StudioButton variant="secondary" size="sm" onClick={addTag}>
            <Plus className="h-3.5 w-3.5" />
            <span>Add</span>
          </StudioButton>
        </div>
      )}
    </div>
  );
};

const ReadonlyField: React.FC<{
  label: string;
  value?: string | null;
  locked?: boolean;
  mono?: boolean;
}> = ({ label, value, locked = false, mono = false }) => (
  <div className="py-3 border-b border-[var(--border-hairline)] last:border-b-0 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-4">
    <span className="text-xs font-medium text-[var(--ink-muted)] inline-flex items-center gap-1.5 shrink-0">
      <span>{label}</span>
      {locked && (
        <span
          title="Managed by EDC AITR administration"
          className="inline-flex items-center gap-0.5 text-[10px] font-mono-data uppercase tracking-wider text-[var(--ink-muted)]"
        >
          <Lock className="h-2.5 w-2.5" />
        </span>
      )}
    </span>
    <span
      className={`text-sm text-[var(--color-2-mood)] sm:text-right break-words ${
        mono ? 'font-mono-data text-xs' : ''
      } ${!value ? 'text-[var(--ink-muted)] italic' : ''}`}
    >
      {value || 'Not provided'}
    </span>
  </div>
);

export const IdentityStudioPage: React.FC = () => {
  const {
    currentUser,
    profileCorrectionRequests,
    updateCurrentUserProfile,
    submitProfileCorrectionRequest,
    toggleMfaForCurrentUser,
    signOut,
    navigate,
    pushToast,
  } = usePortal();

  const [activeSection, setActiveSection] = useState<IdentitySectionId>('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showPublicPreviewModal, setShowPublicPreviewModal] = useState(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);

  // Official record correction modal form state
  const [correctionField, setCorrectionField] = useState<ProfileCorrectionRequest['field']>('designation');
  const [correctionRequestedValue, setCorrectionRequestedValue] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionError, setCorrectionError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    setDraft(buildDraftFromUser(currentUser));
    setIsEditing(false);
    setFormError(null);
  }, [currentUser?.id]);

  if (!currentUser || !draft) return null;

  const baselineDraft = useMemo(() => buildDraftFromUser(currentUser), [currentUser]);
  const isDirty = useMemo(
    () => isEditing && JSON.stringify(draft) !== JSON.stringify(baselineDraft),
    [baselineDraft, draft, isEditing]
  );

  // Preview user object combining live draft changes while editing
  const previewUser: UserProfile = useMemo(() => {
    if (!isEditing) return currentUser;
    return {
      ...currentUser,
      name: draft.name.trim() || currentUser.name,
      preferredName: draft.preferredName.trim() || undefined,
      bio: draft.bio.trim() || undefined,
      city: draft.city.trim() || currentUser.city,
      phone: draft.phone.trim() || undefined,
      department: draft.department.trim() || currentUser.department,
      batch: draft.batch.trim() || currentUser.batch,
      designation: isOfficialDesignationProtected(currentUser.role)
        ? currentUser.designation
        : draft.designation.trim() || currentUser.designation,
      pastEdcRole: draft.pastEdcRole.trim() || undefined,
      teamPosition: draft.teamPosition.trim() || undefined,
      company: draft.company.trim() || undefined,
      industry: draft.industry.trim() || currentUser.industry,
      startupName: draft.startupName.trim() || undefined,
      startupStage: draft.startupStage,
      companyWebsite: draft.companyWebsite.trim() || undefined,
      openToMentorship: draft.openToMentorship,
      mentorshipDomains: draft.mentorshipDomains,
      leadershipIntro: draft.leadershipIntro.trim() || undefined,
      institutionalResponsibilities: draft.institutionalResponsibilities,
      professionalBackground: draft.professionalBackground.trim() || undefined,
      experienceSummary: draft.experienceSummary.trim() || undefined,
      publicAchievements: draft.publicAchievements,
      areasOfResponsibility: draft.areasOfResponsibility,
      expertiseDomains: draft.expertiseDomains,
      mentorshipAreas: draft.mentorshipAreas,
      college: draft.college.trim() || undefined,
      course: draft.course.trim() || undefined,
      academicYear: draft.academicYear.trim() || undefined,
      personalProjects: draft.personalProjects.trim() || undefined,
      startupInterests: draft.startupInterests.trim() || undefined,
      skills: draft.skills,
      interests: draft.interests,
      linkedin: draft.linkedin.trim(),
      websiteUrl: draft.websiteUrl.trim() || undefined,
      portfolioUrl: draft.portfolioUrl.trim() || undefined,
      githubUrl: draft.githubUrl.trim() || undefined,
      avatarUrl: draft.avatarUrl,
      avatarPosition: draft.avatarPosition,
      avatarMeta: draft.avatarMeta,
      profileVisibility: draft.profileVisibility,
      fieldVisibility: draft.fieldVisibility,
    };
  }, [currentUser, draft, isEditing]);

  const completion = useMemo(() => calculateProfileCompletion(previewUser), [previewUser]);
  const currentVisibility = getEffectiveProfileVisibility(previewUser);
  const publicUrlPath = getPublicProfilePath(currentUser.id);
  const isPublicProfileEnabled = currentVisibility === 'public';
  const designationProtected = isOfficialDesignationProtected(currentUser.role);
  const isStaff =
    currentUser.role === 'director' ||
    currentUser.role === 'advisor' ||
    currentUser.role === 'core_team';

  const myCorrectionRequests = useMemo(
    () => profileCorrectionRequests.filter((r) => r.userId === currentUser.id),
    [currentUser.id, profileCorrectionRequests]
  );

  const publicPreviewProjection = useMemo(
    () => getProjectedMemberProfile(previewUser, null, 'preview_public'),
    [previewUser]
  );

  const updateDraft = <K extends keyof DraftState>(key: K, value: DraftState[K]) => {
    setFormError(null);
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const enterEditMode = (targetSection?: IdentitySectionId) => {
    setDraft(buildDraftFromUser(currentUser));
    setFormError(null);
    if (targetSection) setActiveSection(targetSection);
    setIsEditing(true);
  };

  const handleRequestCancel = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
      return;
    }
    setDraft(buildDraftFromUser(currentUser));
    setFormError(null);
    setIsEditing(false);
  };

  const confirmDiscardChanges = () => {
    setDraft(buildDraftFromUser(currentUser));
    setFormError(null);
    setIsEditing(false);
    setShowDiscardConfirm(false);
  };

  const handleSaveChanges = () => {
    setFormError(null);

    if (draft.name.trim().length < 2) {
      setFormError('Full name must be at least 2 characters.');
      setActiveSection('personal');
      return;
    }

    const urlChecks: Array<{ label: string; value: string; section: IdentitySectionId }> = [
      { label: 'LinkedIn URL', value: draft.linkedin, section: 'links' },
      { label: 'Personal Website', value: draft.websiteUrl, section: 'links' },
      { label: 'Portfolio URL', value: draft.portfolioUrl, section: 'links' },
      { label: 'GitHub URL', value: draft.githubUrl, section: 'links' },
      { label: 'Company Website', value: draft.companyWebsite, section: 'professional' },
    ];
    for (const check of urlChecks) {
      const res = normalizeUrlInput(check.value);
      if (!res.valid) {
        setFormError(`${check.label}: ${res.error}`);
        setActiveSection(check.section);
        return;
      }
    }

    const result = updateCurrentUserProfile({
      name: draft.name,
      preferredName: draft.preferredName,
      bio: draft.bio,
      city: draft.city,
      phone: draft.phone,
      department: draft.department,
      batch: draft.batch,
      designation: draft.designation,
      pastEdcRole: draft.pastEdcRole,
      teamPosition: draft.teamPosition,
      company: draft.company,
      industry: draft.industry,
      startupName: draft.startupName,
      startupStage: draft.startupStage,
      companyWebsite: draft.companyWebsite,
      openToMentorship: draft.openToMentorship,
      mentorshipDomains: draft.mentorshipDomains,
      leadershipIntro: draft.leadershipIntro,
      institutionalResponsibilities: draft.institutionalResponsibilities,
      professionalBackground: draft.professionalBackground,
      experienceSummary: draft.experienceSummary,
      publicAchievements: draft.publicAchievements,
      areasOfResponsibility: draft.areasOfResponsibility,
      expertiseDomains: draft.expertiseDomains,
      mentorshipAreas: draft.mentorshipAreas,
      college: draft.college,
      course: draft.course,
      academicYear: draft.academicYear,
      personalProjects: draft.personalProjects,
      startupInterests: draft.startupInterests,
      skills: draft.skills,
      interests: draft.interests,
      linkedin: draft.linkedin,
      websiteUrl: draft.websiteUrl,
      portfolioUrl: draft.portfolioUrl,
      githubUrl: draft.githubUrl,
      avatarUrl: draft.avatarUrl ?? '',
      avatarPosition: draft.avatarPosition,
      avatarMeta: draft.avatarMeta,
      profileVisibility: draft.profileVisibility,
      fieldVisibility: draft.fieldVisibility,
    });

    if (!result.ok) {
      setFormError(result.error ?? 'Unable to save profile changes.');
      return;
    }

    if (result.user) {
      setDraft(buildDraftFromUser(result.user));
    }
    setIsEditing(false);
  };

  const handleCopyPublicLink = () => {
    if (!isPublicProfileEnabled) return;
    const fullUrl = `${window.location.origin}${publicUrlPath}`;
    navigator.clipboard?.writeText(fullUrl).catch(() => {});
    setCopiedLink(true);
    pushToast('Public profile link copied', fullUrl, 'success');
    window.setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleOpenCorrectionModal = () => {
    setCorrectionField(designationProtected ? 'designation' : 'role');
    setCorrectionRequestedValue('');
    setCorrectionReason('');
    setCorrectionError(null);
    setShowCorrectionModal(true);
  };

  const getCurrentValueForCorrectionField = (field: ProfileCorrectionRequest['field']): string => {
    switch (field) {
      case 'role':
        return getRoleLabel(currentUser.role);
      case 'designation':
        return currentUser.designation;
      case 'operationalTeam':
        return currentUser.operationalTeam ?? 'Unassigned';
      case 'tenure':
        return currentUser.tenure === 'current' ? 'Current Active Tenure' : 'Past / Alumni Tenure';
      case 'email':
        return currentUser.email;
      case 'verification':
        return currentUser.verified ? 'Verified Institutional Record' : 'Unverified Member';
    }
  };

  const handleSubmitCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    setCorrectionError(null);
    const res = submitProfileCorrectionRequest({
      field: correctionField,
      currentValue: getCurrentValueForCorrectionField(correctionField),
      requestedValue: correctionRequestedValue,
      reason: correctionReason,
    });
    if (!res.ok) {
      setCorrectionError(res.error ?? 'Could not log correction request.');
      return;
    }
    setShowCorrectionModal(false);
  };

  const visibilityLabel =
    currentVisibility === 'public'
      ? 'Public Profile'
      : currentVisibility === 'edc_members'
        ? 'EDC Members Only'
        : 'Private';

  return (
    <div className="space-y-8 pb-10">
      {/* Unsaved Changes Ribbon */}
      {isEditing && (
        <div
          role="status"
          className="sticky top-[72px] z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-[10px] bg-[var(--surface)]/95 backdrop-blur-md border border-[#C01E30]/40 shadow-sm"
        >
          <div className="flex items-center gap-2.5 text-xs">
            <Edit3 className="h-4 w-4 text-[#C01E30] shrink-0" />
            <span className="font-medium text-[var(--color-2-mood)]">
              Editing Identity Studio
            </span>
            <span className="text-[var(--ink-muted)] hidden sm:inline">
              · {isDirty ? 'You have unsaved changes' : 'Select any section below to update your profile'}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StudioButton variant="ghost" size="sm" onClick={handleRequestCancel}>
              Cancel
            </StudioButton>
            <StudioButton variant="primary" size="sm" onClick={handleSaveChanges}>
              <Save className="h-3.5 w-3.5" />
              <span>Save Changes</span>
            </StudioButton>
          </div>
        </div>
      )}

      {/* A. IDENTITY OVERVIEW HEADER */}
      <section className="border-b border-[var(--border-hairline)] pb-7">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 min-w-0">
            <MemberAvatar
              name={previewUser.preferredName || previewUser.name}
              avatarUrl={previewUser.avatarUrl}
              avatarPosition={previewUser.avatarPosition}
              size="xl"
              tone="obsidian"
            />
            <div className="min-w-0 space-y-1.5">
              <p className="font-mono-data text-[11px] uppercase tracking-[0.14em] text-[#C01E30] dark:text-[#F87171]">
                Identity Studio · {getRoleLabel(currentUser.role)}
                {currentUser.operationalTeam ? ` · ${currentUser.operationalTeam} Unit` : ''}
              </p>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <h1 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight text-[var(--color-2-mood)]">
                  {previewUser.preferredName || previewUser.name}
                </h1>
                {currentUser.verified && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--ink-secondary)]">
                    <ShieldCheck className="h-4 w-4 text-[#C01E30] dark:text-[#F87171]" />
                    <span>Verified</span>
                  </span>
                )}
              </div>
              <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">
                {previewUser.designation}
                {previewUser.company && currentUser.role === 'alumni' ? ` · ${previewUser.company}` : ''}
              </p>
              <p className="text-xs text-[var(--ink-muted)] flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>{previewUser.department}</span>
                {previewUser.batch && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>
                      {previewUser.batch === 'Faculty' ? 'Faculty Leadership' : `Batch ${previewUser.batch}`}
                    </span>
                  </>
                )}
                {previewUser.city && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{previewUser.city}</span>
                  </>
                )}
                <span aria-hidden="true">·</span>
                <span className="font-medium text-[var(--color-2-mood)]">
                  Visibility: {visibilityLabel}
                </span>
              </p>
            </div>
          </div>

          {/* Primary Overview Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {!isEditing ? (
              <StudioButton variant="primary" size="sm" onClick={() => enterEditMode()}>
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit Profile</span>
              </StudioButton>
            ) : (
              <StudioButton variant="primary" size="sm" onClick={handleSaveChanges}>
                <Save className="h-3.5 w-3.5" />
                <span>Save Changes</span>
              </StudioButton>
            )}

            <StudioButton
              variant="secondary"
              size="sm"
              onClick={() => setShowPublicPreviewModal(true)}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Preview Public Profile</span>
            </StudioButton>

            {isPublicProfileEnabled && (
              <StudioButton variant="secondary" size="sm" onClick={handleCopyPublicLink}>
                {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedLink ? 'Link Copied' : 'Copy Profile Link'}</span>
              </StudioButton>
            )}
          </div>
        </div>

        {/* Subtle Editorial Profile Completion Ledger */}
        <div className="mt-6 pt-5 border-t border-[var(--border-hairline)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1 max-w-xl">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[var(--color-2-mood)]">
                Your EDC identity is{' '}
                <span className="font-mono-data font-semibold">{completion.percentage}%</span> complete.
              </span>
              <span className="font-mono-data text-[11px] text-[var(--ink-muted)]">
                {completion.completedCount}/{completion.totalCount} essentials
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[var(--surface-subtle)] border border-[var(--border-hairline)] overflow-hidden">
              <div
                className="h-full bg-[#C01E30] transition-all duration-300"
                style={{ width: `${completion.percentage}%` }}
              />
            </div>
          </div>

          {completion.missingItems.length > 0 ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--ink-muted)]">
              <span>Recommended next:</span>
              {completion.missingItems.slice(0, 3).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => enterEditMode(item.sectionId)}
                  className="text-[var(--color-2-mood)] underline decoration-[var(--border-strong)] underline-offset-4 hover:text-[#C01E30] hover:decoration-[#C01E30] transition-colors cursor-pointer"
                >
                  + {item.label}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--ink-secondary)]">
              All core institutional identity details are in place.
            </p>
          )}
        </div>
      </section>

      {formError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-3.5 rounded-[10px] border border-[#C01E30]/40 bg-[var(--accent-soft)] text-xs text-[#C01E30] dark:text-[#F87171]"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{formError}</span>
        </div>
      )}

      {/* B + C: ASYMMETRIC EDITORIAL WORKSPACE (Section Workspace + Credential Rail) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* C. SECTION-BASED PROFILE WORKSPACE */}
        <div className="xl:col-span-8 space-y-6 min-w-0">
          {/* Section Navigation Rail */}
          <nav
            aria-label="Identity Studio sections"
            className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-[var(--border-hairline)]"
          >
            {SECTIONS.map((sec) => {
              const Icon = sec.icon;
              const active = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveSection(sec.id)}
                  className={`relative shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-[7px] text-xs font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-[var(--surface)] text-[var(--color-2-mood)] border border-[var(--border-strong)] shadow-2xs'
                      : 'text-[var(--ink-muted)] hover:text-[var(--color-2-mood)] hover:bg-[var(--surface)]/60 border border-transparent'
                  }`}
                >
                  <span className="font-mono-data text-[10px] opacity-65">{sec.index}</span>
                  <Icon className="h-3.5 w-3.5" />
                  <span>{sec.shortLabel}</span>
                </button>
              );
            })}
          </nav>

          {/* Active Section Surface */}
          <div className="studio-card p-6 sm:p-7 space-y-6">
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border-hairline)]">
              <div>
                <p className="font-mono-data text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                  Section {SECTIONS.find((s) => s.id === activeSection)?.index}
                </p>
                <h2 className="text-lg font-display font-semibold text-[var(--color-2-mood)] mt-0.5">
                  {SECTIONS.find((s) => s.id === activeSection)?.label}
                </h2>
              </div>
              {!isEditing && activeSection !== 'security' && (
                <StudioButton variant="secondary" size="sm" onClick={() => enterEditMode(activeSection)}>
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Edit Section</span>
                </StudioButton>
              )}
            </div>

            {/* SECTION 01: PERSONAL INFORMATION */}
            {activeSection === 'personal' && (
              <div className="space-y-6">
                {isEditing ? (
                  <>
                    <AvatarUploader
                      name={draft.preferredName || draft.name || currentUser.name}
                      avatarUrl={draft.avatarUrl}
                      avatarPosition={draft.avatarPosition}
                      avatarMeta={draft.avatarMeta}
                      onChange={(next) => {
                        setDraft((prev) =>
                          prev
                            ? {
                                ...prev,
                                avatarUrl: next.avatarUrl,
                                avatarPosition: next.avatarPosition,
                                avatarMeta: next.avatarMeta,
                              }
                            : prev
                        );
                      }}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-[var(--ink-secondary)]">
                          Full Name <span className="text-[#C01E30]">*</span>
                        </label>
                        <input
                          type="text"
                          value={draft.name}
                          onChange={(e) => updateDraft('name', e.target.value)}
                          placeholder="Your full institutional name"
                          className="w-full px-3 py-2 text-sm rounded-[8px] bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--color-2-mood)] focus:outline-none focus:border-[#C01E30]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-[var(--ink-secondary)]">
                          Preferred Display Name (optional)
                        </label>
                        <input
                          type="text"
                          value={draft.preferredName}
                          onChange={(e) => updateDraft('preferredName', e.target.value)}
                          placeholder="Leave blank to use full name"
                          className="w-full px-3 py-2 text-sm rounded-[8px] bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--color-2-mood)] focus:outline-none focus:border-[#C01E30]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-[var(--ink-secondary)]">
                          City
                        </label>
                        <input
                          type="text"
                          value={draft.city}
                          onChange={(e) => updateDraft('city', e.target.value)}
                          placeholder="e.g. Indore, Bangalore"
                          className="w-full px-3 py-2 text-sm rounded-[8px] bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--color-2-mood)] focus:outline-none focus:border-[#C01E30]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-[var(--ink-secondary)]">
                          Phone Number (private by default)
                        </label>
                        <input
                          type="tel"
                          value={draft.phone}
                          onChange={(e) => updateDraft('phone', e.target.value)}
                          placeholder="+91 98260 XXXXX"
                          className="w-full px-3 py-2 text-sm rounded-[8px] bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--color-2-mood)] focus:outline-none focus:border-[#C01E30]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-medium text-[var(--ink-secondary)]">
                          Short Biography / Introduction
                        </label>
                        <span className="font-mono-data text-[10px] text-[var(--ink-muted)]">
                          {draft.bio.length}/500
                        </span>
                      </div>
                      <textarea
                        rows={4}
                        maxLength={500}
                        value={draft.bio}
                        onChange={(e) => updateDraft('bio', e.target.value)}
                        placeholder="Summarize your work, academic focus, or entrepreneurial journey at EDC AITR..."
                        className="w-full px-3 py-2 text-sm rounded-[8px] bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--color-2-mood)] focus:outline-none focus:border-[#C01E30] leading-relaxed"
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-5">
                    {currentUser.bio ? (
                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--ink-muted)]">
                          Biography
                        </p>
                        <p className="text-sm text-[var(--color-2-mood)] leading-relaxed max-w-2xl">
                          {currentUser.bio}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--ink-muted)] italic">
                        Add a short biography to introduce yourself across the EDC AITR network.
                      </p>
                    )}

                    <div className="border-t border-[var(--border-hairline)]">
                      <ReadonlyField label="Full Name" value={currentUser.name} />
                      {currentUser.preferredName && (
                        <ReadonlyField label="Preferred Display Name" value={currentUser.preferredName} />
                      )}
                      <ReadonlyField label="Institutional Email" value={currentUser.email} locked mono />
                      <ReadonlyField label="City" value={currentUser.city} />
                      <ReadonlyField
                        label="Phone Number"
                        value={currentUser.phone ? `${currentUser.phone} (Private)` : undefined}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SECTION 02: EDC AFFILIATION (Protected Institutional Records + Editable Context) */}
            {activeSection === 'affiliation' && (
              <div className="space-y-6">
                <div className="p-4 rounded-[10px] bg-[var(--surface-subtle)]/75 border border-[var(--border-hairline)] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Lock className="h-3.5 w-3.5 text-[var(--ink-muted)]" />
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--ink-secondary)]">
                        Protected Institutional Records
                      </p>
                    </div>
                    <StudioButton variant="secondary" size="sm" onClick={handleOpenCorrectionModal}>
                      <FileEdit className="h-3.5 w-3.5" />
                      <span>Request Official Record Correction</span>
                    </StudioButton>
                  </div>
                  <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                    Role assignments, official council designations, operational units, tenure, and
                    verification status are maintained by EDC AITR administration and cannot be
                    self-modified.
                  </p>

                  <div className="border-t border-[var(--border-hairline)] pt-1">
                    <ReadonlyField label="Member ID" value={currentUser.id} locked mono />
                    <ReadonlyField label="Assigned Role" value={getRoleLabel(currentUser.role)} locked />
                    {designationProtected && (
                      <ReadonlyField label="Official Designation" value={currentUser.designation} locked />
                    )}
                    {currentUser.operationalTeam && (
                      <ReadonlyField
                        label="Operational Unit"
                        value={`${currentUser.operationalTeam} Operational Team`}
                        locked
                      />
                    )}
                    <ReadonlyField
                      label="Tenure Classification"
                      value={currentUser.tenure === 'current' ? 'Active Institutional Tenure' : 'Past / Alumni Tenure'}
                      locked
                    />
                    <ReadonlyField
                      label="Verification Status"
                      value={currentUser.verified ? 'Verified Institutional Record' : 'Standard Member Account'}
                      locked
                    />
                  </div>
                </div>

                {/* Editable Affiliation Context */}
                {isEditing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-[var(--ink-secondary)]">
                        Department / Branch
                      </label>
                      <input
                        type="text"
                        value={draft.department}
                        onChange={(e) => updateDraft('department', e.target.value)}
                        placeholder="e.g. B.Tech CSE · III Year"
                        className="w-full px-3 py-2 text-sm rounded-[8px] bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--color-2-mood)] focus:outline-none focus:border-[#C01E30]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-[var(--ink-secondary)]">
                        {currentUser.role === 'alumni' ? 'Graduation Batch' : 'Batch / Cohort'}
                      </label>
                      <input
                        type="text"
                        value={draft.batch}
                        onChange={(e) => updateDraft('batch', e.target.value)}
                        placeholder="e.g. 2026"
                        className="w-full px-3 py-2 text-sm rounded-[8px] bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--color-2-mood)] focus:outline-none focus:border-[#C01E30]"
                      />
                    </div>

                    {currentUser.role === 'core_team' && (
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="block text-xs font-medium text-[var(--ink-secondary)]">
                          Position Within Operational Team
                        </label>
                        <input
                          type="text"
                          value={draft.teamPosition}
                          onChange={(e) => updateDraft('teamPosition', e.target.value)}
                          placeholder="e.g. Registration Desk Unit Lead"
                          className="w-full px-3 py-2 text-sm rounded-[8px] bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--color-2-mood)] focus:outline-none focus:border-[#C01E30]"
                        />
                      </div>
                    )}

                    {(currentUser.role === 'alumni' || currentUser.role === 'core_team' || currentUser.role === 'advisor') && (
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="block text-xs font-medium text-[var(--ink-secondary)]">
                          Past EDC Role / History
                        </label>
                        <input
                          type="text"
                          value={draft.pastEdcRole}
                          onChange={(e) => updateDraft('pastEdcRole', e.target.value)}
                          placeholder="e.g. President, EDC AITR (2021–22)"
                          className="w-full px-3 py-2 text-sm rounded-[8px] bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--color-2-mood)] focus:outline-none focus:border-[#C01E30]"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border-t border-[var(--border-hairline)]">
                    <ReadonlyField label="Department / Academic Branch" value={currentUser.department} />
                    <ReadonlyField
                      label={currentUser.role === 'alumni' ? 'Graduation Batch' : 'Batch / Cohort'}
                      value={currentUser.batch}
                    />
                    {currentUser.role === 'core_team' && (
                      <ReadonlyField label="Position Within Team" value={currentUser.teamPosition} />
                    )}
                    {currentUser.pastEdcRole && (
                      <ReadonlyField label="Past EDC Role" value={currentUser.pastEdcRole} />
                    )}
                  </div>
                )}

                {/* User's Submitted Record Correction Requests */}
                {myCorrectionRequests.length > 0 && (
                  <div className="pt-4 border-t border-[var(--border-hairline)] space-y-2.5">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--ink-muted)]">
                      Submitted Record Correction Requests ({myCorrectionRequests.length})
                    </p>
                    <div className="space-y-2">
                      {myCorrectionRequests.map((req) => (
                        <div
                          key={req.id}
                          className="p-3 rounded-[8px] bg-[var(--surface-subtle)] border border-[var(--border-hairline)] text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-[var(--color-2-mood)] capitalize">
                              {req.field.replace(/([A-Z])/g, ' $1')} → {req.requestedValue}
                            </span>
                            <span className="font-mono-data text-[10px] uppercase tracking-wider text-[#C01E30] dark:text-[#F87171]">
                              {req.status}
                            </span>
                          </div>
                          <p className="text-[var(--ink-muted)]">{req.reason}</p>
                          <p className="font-mono-data text-[10px] text-[var(--ink-muted)]">
                            Logged {req.submittedAt}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SECTION 03: ROLE-AWARE PROFESSIONAL IDENTITY */}
            {activeSection === 'professional' && (
              <div className="space-y-6">
                {/* DIRECTOR FIELDS */}
                {currentUser.role === 'director' && (
                  isEditing ? (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-[var(--ink-secondary)]">
                          Leadership Introduction
                        </label>
                        <textarea
                          rows={3}
                          value={draft.leadershipIntro}
                          onChange={(e) => updateDraft('leadershipIntro', e.target.value)}
                          placeholder="Institutional mandate and venture incubation vision..."
                          className="w-full px-3 py-2 text-sm rounded-[8px] bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--color-2-mood)] focus:outline-none focus:border-[#C01E30]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-[var(--ink-secondary)]">
                          Professional Background
                        </label>
                        <textarea
                          rows={3}
                          value={draft.professionalBackground}
                          onChange={(e) => updateDraft('professionalBackground', e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-[8px] bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--color-2-mood)] focus:outline-none focus:border-[#C01E30]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-[var(--ink-secondary)]">
                          Experience Summary
                        </label>
                        <textarea
                          rows={2}
                          value={draft.experienceSummary}
                          onChange={(e) => updateDraft('experienceSummary', e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-[8px] bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--color-2-mood)] focus:outline-none focus:border-[#C01E30]"
                        />
                      </div>
                      <TagEditor
                        label="Areas of Institutional Responsibility"
                        items={draft.institutionalResponsibilities}
                        placeholder="Add responsibility and press Enter..."
                        editable
                        onChange={(next) => updateDraft('institutionalResponsibilities', next)}
                      />
                      <TagEditor
                        label="Public Achievements & Milestones"
                        items={draft.publicAchievements}
                        placeholder="Add milestone and press Enter..."
                        editable
                        onChange={(next) => updateDraft('publicAchievements', next)}
                      />
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {currentUser.leadershipIntro && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--ink-muted)]">
                            Leadership Introduction
                          </p>
                          <p className="text-sm text-[var(--color-2-mood)] leading-relaxed">
                            {currentUser.leadershipIntro}
                          </p>
                        </div>
                      )}
                      <div className="border-t border-[var(--border-hairline)]">
                        <ReadonlyField label="Institution" value={currentUser.company} />
                        <ReadonlyField label="Domain Focus" value={currentUser.industry} />
                        <ReadonlyField label="Professional Background" value={currentUser.professionalBackground} />
                        <ReadonlyField label="Experience Summary" value={currentUser.experienceSummary} />
                      </div>
                      {currentUser.institutionalResponsibilities && currentUser.institutionalResponsibilities.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--ink-muted)]">
                            Areas of Institutional Responsibility
                          </p>
                          <ul className="space-y-1.5 text-sm text-[var(--ink-secondary)] list-disc pl-5">
                            {currentUser.institutionalResponsibilities.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {currentUser.publicAchievements && currentUser.publicAchievements.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--ink-muted)]">
                            Public Achievements
                          </p>
                          <ul className="space-y-1.5 text-sm text-[var(--ink-secondary)] list-disc pl-5">
                            {currentUser.publicAchievements.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )
                )}

                {/* CORE TEAM FIELDS */}
                {currentUser.role === 'core_team' && (
                  isEditing ? (
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium text-[var(--ink-secondary)]">
                            Primary Industry / Domain Focus
                          </label>
                          <input
                            type="text"
                            value={draft.industry}
                            onChange={(e) => updateDraft('industry', e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-[8px] bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--color-2-mood)] focus:outline-none focus:border-[#C01E30]"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium text-[var(--ink-secondary)]">
                            Venture Stage (if building)
                          </label>
                          <select
                            value={draft.startupStage}
                            onChange={(e) =>
                              updateDraft('startupStage', e.target.value as NonNullable<UserProfile['startupStage']>)
                            }
                            className="w-full px-3 py-2 text-sm rounded-[8px] bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--color-2-mood)] focus:outline-none focus:border-[#C01E30]"
                          >
                            {STARTUP_STAGES.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <TagEditor
                        label="Areas of Operational Responsibility"
                        hint="Key mandates you own inside EDC AITR."
                        items={draft.areasOfResponsibility}
                        placeholder="e.g. Delegate QR check-in architecture"
                        editable
                        onChange={(next) => updateDraft('areasOfResponsibility', next)}
                      />
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="border-t border-[var(--border-hairline)]">
                        <ReadonlyField label="Operational Team" value={currentUser.operationalTeam} locked />
                        <ReadonlyField label="Position Within Team" value={currentUser.teamPosition} />
                        <ReadonlyField label="Domain Focus" value={currentUser.industry} />
                        <ReadonlyField label="Startup Stage" value={currentUser.startupStage} />
                      </div>
                      {currentUser.areasOfResponsibility && currentUser.areasOfResponsibility.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--ink-muted)]">
                            Areas of Operational Responsibility
                          </p>
                          <ul className="space-y-1.5 text-sm text-[var(--ink-secondary)] list-disc pl-5">
                            {currentUser.areasOfResponsibility.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )
                )}

                {/* ADVISOR FIELDS */}
                {currentUser.role === 'advisor' && (
                  isEditing ? (
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium text-[var(--ink-secondary)]">
                            Professional Designation
                          </label>
                          <input
                            type="text"
                            value={draft.designation}
                            onChange={(e) => updateDraft('designation', e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-[8px] bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--color-2-mood)] focus:outline-none focus:border-[#C01E30]"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium text-[var(--ink-secondary)]">
                            Organization / Institution
                          </label>
                          <input
                            type="text"
                            value={draft.company}
                            onChange={(e) => updateDraft('company', e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-[8px] bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--color-2-mood)] focus:outline-none focus:border-[#C01E30]"
                          />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="block text-xs font-medium text-[var(--ink-secondary)]">
                            Industry / Advisory Sector
                          </label>
                          <input
                            type="text"
                            value={draft.industry}
                            onChange={(e) => updateDraft('industry', e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-[8px] bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--color-2-mood)] focus:outline-none focus:border-[#C01E30]"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-[var(--ink-secondary)]">
                          Professional Experience Summary
                        </label>
                        <textarea
                          rows={3}
                          value={draft.experienceSummary}
                          onChange={(e) => updateDraft('experienceSummary', e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-[8px] bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--color-2-mood)] focus:outline-none focus:border-[#C01E30]"
                        />
                      </div>
                      <TagEditor
                        label="Expertise Domains"
                        items={draft.expertiseDomains}
                        placeholder="e.g. Intellectual Property Filing"
                        editable
                        onChange={(next) => updateDraft('expertiseDomains', next)}
                      />
                      <TagEditor
                        label="Mentorship Areas"
                        items={draft.mentorshipAreas}
                        placeholder="e.g. Pre-incubation pitch reviews"
                        editable
                        onChange={(next) => updateDraft('mentorshipAreas', next)}
                      />
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="border-t border-[var(--border-hairline)]">
                        <ReadonlyField label="Professional Designation" value={currentUser.designation} />
                        <ReadonlyField label="Organization" value={currentUser.company} />
                        <ReadonlyField label="Industry Sector" value={currentUser.industry} />
                        <ReadonlyField label="Professional Experience" value={currentUser.experienceSummary} />
                      </div>
                      <TagEditor
                        label="Expertise Domains"
                        items={currentUser.expertiseDomains ?? []}
                        placeholder=""
                        editable={false}
                        onChange={() => {}}
                      />
                      <TagEditor
                        label="Mentorship Areas"
                        items={currentUser.mentorshipAreas ?? []}
                        placeholder=""
                        editable={false}
                        onChange={() => {}}
                      />
                    </div>
                  )
                )}

                {/* ALUMNI FIELDS */}
                {currentUser.role === 'alumni' && (
                  isEditing ? (
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium text-[var(--ink-secondary)]">
                            Current Designation
                          </label>
                          <input
                            type="text"
                            value={draft.designation}
                            onChange={(e) => updateDraft('designation', e.target.value)}
                            placeholder="e.g. Co-Founder & CTO"
                            className="w-full px-3 py-2 text-sm rounded-[8px] bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--color-2-mood)] focus:outline-none focus:border-[#C01E30]"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium text-[var(--ink-secondary)]">
                            Current Company
                          </label>
                          <input
                            type="text"
                            value={draft.company}
                            onChange={(e) => updateDraft('company', e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-[8px] bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--color-2-mood)] focus:outline-none focus:border-[#C01E30]"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium text-[var(--ink-secondary)]">
                            Industry
                          </label>
                          <input
                            type="text"
                            value={draft.industry}
                            onChange={(e) => updateDraft('industry', e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-[8px] bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--color-2-mood)] focus:outline-none focus:border-[#C01E30]"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium text-[var(--ink-secondary)]">
                            Company Website
                          </label>
                          <input
                            type="url"
                            value={draft.companyWebsite}
                            onChange={(e) => updateDraft('companyWebsite', e.target.value)}
                            placeholder="https://yourcompany.in"
                            className="w-full px-3 py-2 text-sm rounded-[8px] bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--color-2-mood)] focus:outline-none focus:border-[#C01E30]"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium text-[var(--ink-secondary)]">
                            Startup Name (if founder)
                          </label>
                          <input
                            type="text"
                            value={draft.startupName}
                            onChange={(e) => updateDraft('startupName', e.target.value)}
                            placeholder="Optional"
                            className="w-full px-3 py-2 text-sm rounded-[8px] bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--color-2-mood)] focus:outline-none focus:border-[#C01E30]"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium text-[var(--ink-secondary)]">
                            Startup Stage
                          </label>
                          <select
                            value={draft.startupStage}
                            onChange={(e) =>
                              updateDraft('startupStage', e.target.value as NonNullable<UserProfile['startupStage']>)
                            }
                            className="w-full px-3 py-2 text-sm rounded-[8px] bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--color-2-mood)] focus:outline-none focus:border-[#C01E30]"
                          >
                            {STARTUP_STAGES.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-[var(--ink-secondary)]">
                          Professional Experience Summary
                        </label>
                        <textarea
                          rows={3}
                          value={draft.experienceSummary}
                          onChange={(e) => updateDraft('experienceSummary', e.target.value)}
                          placeholder="Brief overview of your post-graduation career or founding journey..."
                          className="w-full px-3 py-2 text-sm rounded-[8px] bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--color-2-mood)] focus:outline-none focus:border-[#C01E30]"
                        />
                      </div>

                      {/* Open to Mentorship */}
                      <div className="p-4 rounded-[10px] border border-[var(--border-hairline)] bg-[var(--surface-subtle)]/60 space-y-4">
                        <label className="flex items-start justify-between gap-4 cursor-pointer">
                          <div>
                            <p className="text-sm font-medium text-[var(--color-2-mood)]">
                              Open to Mentorship
                            </p>
                            <p className="text-xs text-[var(--ink-muted)] mt-0.5">
                              Signal availability to mentor current EDC AITR student founders on selected domains.
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            checked={draft.openToMentorship}
                            onChange={(e) => updateDraft('openToMentorship', e.target.checked)}
                            className="mt-1 h-4 w-4 accent-[#C01E30] cursor-pointer"
                          />
                        </label>

                        {draft.openToMentorship && (
                          <TagEditor
                            label="Preferred Mentorship Domains"
                            items={draft.mentorshipDomains}
                            placeholder="e.g. Seed Fundraising, B2B GTM"
                            editable
                            onChange={(next) => updateDraft('mentorshipDomains', next)}
                          />
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="border-t border-[var(--border-hairline)]">
                        <ReadonlyField label="Current Designation" value={currentUser.designation} />
                        <ReadonlyField label="Current Company" value={currentUser.company} />
                        <ReadonlyField label="Industry" value={currentUser.industry} />
                        <ReadonlyField label="Startup Name" value={currentUser.startupName} />
                        <ReadonlyField
                          label="Startup Stage"
                          value={currentUser.startupStage && currentUser.startupStage !== 'None' ? currentUser.startupStage : 'Not applicable'}
                        />
                        <ReadonlyField label="Company Website" value={currentUser.companyWebsite} />
                        <ReadonlyField label="Experience Summary" value={currentUser.experienceSummary} />
                        <ReadonlyField
                          label="Mentorship Availability"
                          value={currentUser.openToMentorship ? 'Open to mentoring student founders' : 'Not currently accepting mentorship requests'}
                        />
                      </div>
                      {currentUser.openToMentorship && currentUser.mentorshipDomains && currentUser.mentorshipDomains.length > 0 && (
                        <TagEditor
                          label="Preferred Mentorship Domains"
                          items={currentUser.mentorshipDomains}
                          placeholder=""
                          editable={false}
                          onChange={() => {}}
                        />
                      )}
                    </div>
                  )
                )}

                {/* PARTICIPANT FIELDS */}
                {currentUser.role === 'participant' && (
                  isEditing ? (
                    <div className="space-y-4">
                      <p className="text-xs text-[var(--ink-muted)]">
                        Share as much or as little as you like — optional startup or project fields are never mandatory.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="block text-xs font-medium text-[var(--ink-secondary)]">
                            College / Institution
                          </label>
                          <input
                            type="text"
                            value={draft.college}
                            onChange={(e) => updateDraft('college', e.target.value)}
                            placeholder="Acropolis Institute of Technology & Research, Indore"
                            className="w-full px-3 py-2 text-sm rounded-[8px] bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--color-2-mood)] focus:outline-none focus:border-[#C01E30]"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium text-[var(--ink-secondary)]">
                            Course / Degree
                          </label>
                          <input
                            type="text"
                            value={draft.course}
                            onChange={(e) => updateDraft('course', e.target.value)}
                            placeholder="e.g. B.Tech Computer Science"
                            className="w-full px-3 py-2 text-sm rounded-[8px] bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--color-2-mood)] focus:outline-none focus:border-[#C01E30]"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium text-[var(--ink-secondary)]">
                            Academic Year
                          </label>
                          <input
                            type="text"
                            value={draft.academicYear}
                            onChange={(e) => updateDraft('academicYear', e.target.value)}
                            placeholder="e.g. II Year"
                            className="w-full px-3 py-2 text-sm rounded-[8px] bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--color-2-mood)] focus:outline-none focus:border-[#C01E30]"
                          />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="block text-xs font-medium text-[var(--ink-secondary)]">
                            Headline / Role Tagline
                          </label>
                          <input
                            type="text"
                            value={draft.designation}
                            onChange={(e) => updateDraft('designation', e.target.value)}
                            placeholder="e.g. Student Builder · CSI Cohort 05"
                            className="w-full px-3 py-2 text-sm rounded-[8px] bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--color-2-mood)] focus:outline-none focus:border-[#C01E30]"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-[var(--ink-secondary)]">
                          Personal Projects (optional)
                        </label>
                        <textarea
                          rows={3}
                          value={draft.personalProjects}
                          onChange={(e) => updateDraft('personalProjects', e.target.value)}
                          placeholder="Briefly describe prototypes, hackathon builds, or technical projects..."
                          className="w-full px-3 py-2 text-sm rounded-[8px] bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--color-2-mood)] focus:outline-none focus:border-[#C01E30]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-[var(--ink-secondary)]">
                          Startup Interests (optional)
                        </label>
                        <input
                          type="text"
                          value={draft.startupInterests}
                          onChange={(e) => updateDraft('startupInterests', e.target.value)}
                          placeholder="e.g. ClimateTech, Applied AI, Developer Tools"
                          className="w-full px-3 py-2 text-sm rounded-[8px] bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--color-2-mood)] focus:outline-none focus:border-[#C01E30]"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="border-t border-[var(--border-hairline)]">
                      <ReadonlyField label="College / Institution" value={currentUser.college} />
                      <ReadonlyField label="Course / Degree" value={currentUser.course} />
                      <ReadonlyField label="Academic Year" value={currentUser.academicYear} />
                      <ReadonlyField label="Personal Projects" value={currentUser.personalProjects} />
                      <ReadonlyField label="Startup Interests" value={currentUser.startupInterests} />
                    </div>
                  )
                )}
              </div>
            )}

            {/* SECTION 04: SKILLS & INTERESTS */}
            {activeSection === 'skills' && (
              <div className="space-y-6">
                <TagEditor
                  label="Core Skills & Capabilities"
                  hint="Technical, operational, design, or venture skills you contribute."
                  items={isEditing ? draft.skills : currentUser.skills ?? []}
                  placeholder="e.g. Product Strategy, React, Financial Modeling"
                  editable={isEditing}
                  onChange={(next) => updateDraft('skills', next)}
                />

                <div className="pt-4 border-t border-[var(--border-hairline)]">
                  <TagEditor
                    label="Areas of Interest"
                    hint="Sectors, themes, and entrepreneurial domains you follow."
                    items={isEditing ? draft.interests : currentUser.interests ?? []}
                    placeholder="e.g. DeepTech, Fintech, Campus Startups"
                    editable={isEditing}
                    onChange={(next) => updateDraft('interests', next)}
                  />
                </div>
              </div>
            )}

            {/* SECTION 05: SOCIAL & PORTFOLIO LINKS */}
            {activeSection === 'links' && (
              <div className="space-y-4">
                {isEditing ? (
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-[var(--ink-secondary)]">
                        LinkedIn Profile URL
                      </label>
                      <input
                        type="url"
                        value={draft.linkedin}
                        onChange={(e) => updateDraft('linkedin', e.target.value)}
                        placeholder="https://www.linkedin.com/in/your-handle"
                        className="w-full px-3 py-2 text-sm rounded-[8px] bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--color-2-mood)] focus:outline-none focus:border-[#C01E30]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-[var(--ink-secondary)]">
                        Personal Website
                      </label>
                      <input
                        type="url"
                        value={draft.websiteUrl}
                        onChange={(e) => updateDraft('websiteUrl', e.target.value)}
                        placeholder="https://yourdomain.in"
                        className="w-full px-3 py-2 text-sm rounded-[8px] bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--color-2-mood)] focus:outline-none focus:border-[#C01E30]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-[var(--ink-secondary)]">
                        Portfolio URL
                      </label>
                      <input
                        type="url"
                        value={draft.portfolioUrl}
                        onChange={(e) => updateDraft('portfolioUrl', e.target.value)}
                        placeholder="https://portfolio.example.com"
                        className="w-full px-3 py-2 text-sm rounded-[8px] bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--color-2-mood)] focus:outline-none focus:border-[#C01E30]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-[var(--ink-secondary)]">
                        GitHub Profile URL
                      </label>
                      <input
                        type="url"
                        value={draft.githubUrl}
                        onChange={(e) => updateDraft('githubUrl', e.target.value)}
                        placeholder="https://github.com/username"
                        className="w-full px-3 py-2 text-sm rounded-[8px] bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--color-2-mood)] focus:outline-none focus:border-[#C01E30]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--border-hairline)]">
                    {[
                      {
                        label: 'LinkedIn',
                        url: currentUser.linkedin && currentUser.linkedin !== 'https://linkedin.com' ? currentUser.linkedin : undefined,
                      },
                      { label: 'Personal Website', url: currentUser.websiteUrl },
                      { label: 'Portfolio', url: currentUser.portfolioUrl },
                      { label: 'GitHub', url: currentUser.githubUrl },
                    ].map((link) => (
                      <div key={link.label} className="py-3 flex items-center justify-between gap-4">
                        <span className="text-xs font-medium text-[var(--ink-muted)]">{link.label}</span>
                        {link.url ? (
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-[var(--color-2-mood)] hover:text-[#C01E30] dark:hover:text-[#F87171] truncate max-w-[320px]"
                          >
                            <span className="truncate">{link.url.replace(/^https?:\/\//, '')}</span>
                            <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-sm text-[var(--ink-muted)] italic">Not linked</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SECTION 06: PRIVACY & VISIBILITY */}
            {activeSection === 'privacy' && (
              <div className="space-y-6">
                {/* Profile-level visibility selector */}
                <div className="space-y-2.5">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--ink-muted)]">
                    Profile Visibility Tier
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {(
                      [
                        {
                          value: 'private' as const,
                          title: 'Private',
                          desc: 'Visible only to you and authorized EDC leadership. Excluded from member directory.',
                          icon: Lock,
                        },
                        {
                          value: 'edc_members' as const,
                          title: 'EDC Members Only',
                          desc: 'Visible to authenticated EDC AITR members inside the portal and directory.',
                          icon: Users,
                        },
                        {
                          value: 'public' as const,
                          title: 'Public Profile',
                          desc: `Shareable at ${publicUrlPath} exposing only fields explicitly marked Public.`,
                          icon: Globe,
                        },
                      ]
                    ).map((opt) => {
                      const Icon = opt.icon;
                      const selected =
                        (isEditing ? draft.profileVisibility : currentVisibility) === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            if (!isEditing) {
                              enterEditMode('privacy');
                            }
                            updateDraft('profileVisibility', opt.value);
                          }}
                          className={`text-left p-4 rounded-[10px] border transition-colors cursor-pointer space-y-1.5 ${
                            selected
                              ? 'border-[#C01E30] bg-[var(--accent-soft)]/50'
                              : 'border-[var(--border-hairline)] bg-[var(--surface-subtle)]/50 hover:border-[var(--border-strong)]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-2-mood)]">
                              <Icon className="h-3.5 w-3.5 text-[#C01E30] dark:text-[#F87171]" />
                              <span>{opt.title}</span>
                            </span>
                            {selected && <Check className="h-3.5 w-3.5 text-[#C01E30]" />}
                          </div>
                          <p className="text-xs text-[var(--ink-muted)] leading-relaxed">{opt.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Field-level visibility matrix */}
                <div className="space-y-3 pt-4 border-t border-[var(--border-hairline)]">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--ink-muted)]">
                      Field-Level Visibility Controls
                    </p>
                    <p className="text-xs text-[var(--ink-muted)] mt-0.5">
                      Control who can view each field. Phone and email can never be exposed on unauthenticated public routes.
                    </p>
                  </div>

                  <div className="divide-y divide-[var(--border-hairline)] border border-[var(--border-hairline)] rounded-[10px] overflow-hidden">
                    {FIELD_VISIBILITY_ROWS.map((row) => {
                      const currentFieldMap = isEditing
                        ? draft.fieldVisibility
                        : getEffectiveFieldVisibility(currentUser);
                      const currentVal: FieldVisibilitySetting =
                        currentFieldMap[row.key] ?? DEFAULT_FIELD_VISIBILITY[row.key];

                      return (
                        <div
                          key={row.key}
                          className="px-4 py-3 bg-[var(--surface)] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[var(--color-2-mood)]">
                              {row.label}
                            </p>
                            <p className="text-[11px] text-[var(--ink-muted)]">{row.hint}</p>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {(
                              [
                                { v: 'private' as const, l: 'Private' },
                                { v: 'edc_members' as const, l: 'EDC Only' },
                                ...(row.allowPublic ? [{ v: 'public' as const, l: 'Public' }] : []),
                              ]
                            ).map((choice) => {
                              const active = currentVal === choice.v;
                              return (
                                <button
                                  key={choice.v}
                                  type="button"
                                  onClick={() => {
                                    if (!isEditing) {
                                      enterEditMode('privacy');
                                    }
                                    setDraft((prev) =>
                                      prev
                                        ? {
                                            ...prev,
                                            fieldVisibility: {
                                              ...prev.fieldVisibility,
                                              [row.key]: choice.v,
                                            },
                                          }
                                        : prev
                                    );
                                  }}
                                  className={`px-2.5 py-1 rounded-[6px] text-[11px] font-medium transition-colors cursor-pointer ${
                                    active
                                      ? 'bg-[var(--color-2-mood)] text-[var(--surface)]'
                                      : 'text-[var(--ink-muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--color-2-mood)]'
                                  }`}
                                >
                                  {choice.l}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Live Public Route Status */}
                <div className="p-4 rounded-[10px] bg-[var(--surface-subtle)] border border-[var(--border-hairline)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-[var(--color-2-mood)]">
                      {isPublicProfileEnabled
                        ? 'Public Member URL Active'
                        : 'Public Member URL Inactive'}
                    </p>
                    <p className="text-xs text-[var(--ink-muted)]">
                      {isPublicProfileEnabled
                        ? `Anyone with ${publicUrlPath} can view fields explicitly marked Public.`
                        : 'Set profile visibility to Public Profile and save changes to activate your shareable URL.'}
                    </p>
                  </div>
                  {isPublicProfileEnabled && (
                    <StudioButton
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(publicUrlPath)}
                    >
                      <span>Open Public Page</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </StudioButton>
                  )}
                </div>
              </div>
            )}

            {/* SECTION 07: ACCOUNT SECURITY */}
            {activeSection === 'security' && (
              <div className="space-y-6">
                <div className="border-t border-[var(--border-hairline)]">
                  <ReadonlyField label="Institutional Account Email" value={currentUser.email} locked mono />
                  <ReadonlyField label="Account Role" value={getRoleLabel(currentUser.role)} locked />
                  <ReadonlyField label="Current Visibility Tier" value={visibilityLabel} />
                  <ReadonlyField
                    label="Two-Factor Protection (TOTP)"
                    value={currentUser.mfaEnabled ? 'Enabled' : 'Not Enabled'}
                  />
                </div>

                {/* Existing Real MFA Toggle */}
                <div className="p-4 rounded-[10px] border border-[var(--border-hairline)] bg-[var(--surface-subtle)]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-[#C01E30]" />
                      <p className="text-sm font-semibold text-[var(--color-2-mood)]">
                        Authenticator 2FA (TOTP)
                      </p>
                    </div>
                    <p className="text-xs text-[var(--ink-muted)] leading-relaxed max-w-lg">
                      Protects governance sign-offs and institutional portal sessions with a
                      time-based one-time passcode.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <StudioButton
                      variant={currentUser.mfaEnabled ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => toggleMfaForCurrentUser(!currentUser.mfaEnabled)}
                    >
                      {currentUser.mfaEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                    </StudioButton>
                    {isStaff && (
                      <StudioButton
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/account/mfa')}
                      >
                        Configure TOTP
                      </StudioButton>
                    )}
                  </div>
                </div>

                {/* Honest Credential Management Note (No Fake Password Reset) */}
                <div className="p-4 rounded-[10px] border border-[var(--border-hairline)] space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--ink-muted)]">
                    Authentication &amp; Prototype Persistence Notice
                  </p>
                  <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
                    Account credentials and role assignments are managed by the EDC AITR portal
                    authentication flow rather than an inline password form. In this browser
                    prototype, profile updates persist locally via{' '}
                    <span className="font-mono-data">localStorage</span> and uploaded portraits
                    persist in browser <span className="font-mono-data">IndexedDB</span> on this
                    device — they do not synchronize across devices or remote servers.
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-hairline)]">
                  <StudioButton variant="secondary" size="sm" onClick={() => navigate('/account')}>
                    Switch Demo Account
                  </StudioButton>
                  <StudioButton
                    variant="secondary"
                    size="sm"
                    onClick={signOut}
                    className="text-[#C01E30] dark:text-[#F87171] border-[#C01E30]/35 hover:border-[#C01E30]"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </StudioButton>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* B. INSTITUTIONAL IDENTITY CREDENTIAL RAIL */}
        <aside className="xl:col-span-4 space-y-5">
          <div className="studio-card p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3">
              <div>
                <p className="font-mono-data text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                  Institutional Credential
                </p>
                <h2 className="text-base font-display font-semibold text-[var(--color-2-mood)] mt-0.5">
                  EDC AITR Identity Card
                </h2>
              </div>
              <GraduationCap className="h-4 w-4 text-[#C01E30]" />
            </div>

            <IdentityCredentialCard
              user={previewUser}
              actionLabel={isPublicProfileEnabled ? 'Public View' : 'Preview'}
              onActionClick={() => setShowPublicPreviewModal(true)}
            />

            <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed border-t border-[var(--border-hairline)] pt-3">
              Your credential card displays institutional affiliation only — private email and phone
              details are never shown on the card.
            </p>
          </div>

          {/* Governance & Visibility Quick Summary */}
          <div className="studio-card p-5 space-y-3">
            <p className="font-mono-data text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              Record Summary
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[var(--ink-muted)]">Role Tier</span>
                <span className="font-medium text-[var(--color-2-mood)]">{getRoleLabel(currentUser.role)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--ink-muted)]">Profile Visibility</span>
                <span className="font-medium text-[var(--color-2-mood)]">{visibilityLabel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--ink-muted)]">Directory Listing</span>
                <span className="font-medium text-[var(--color-2-mood)]">
                  {currentVisibility === 'private' ? 'Hidden' : 'Listed (EDC Members)'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--ink-muted)]">2FA Protection</span>
                <span className="font-medium text-[var(--color-2-mood)]">
                  {currentUser.mfaEnabled ? 'Active' : 'Off'}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* UNSAVED CHANGES CONFIRMATION MODAL */}
      <ModalDialog
        open={showDiscardConfirm}
        onClose={() => setShowDiscardConfirm(false)}
        title="Discard unsaved profile changes?"
        maxWidthClass="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 text-sm text-[var(--ink-secondary)]">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              You have unsaved edits in Identity Studio. Discard them or return to save your changes.
            </p>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-hairline)]">
            <StudioButton variant="secondary" size="sm" onClick={() => setShowDiscardConfirm(false)}>
              Keep Editing
            </StudioButton>
            <StudioButton variant="primary" size="sm" onClick={confirmDiscardChanges}>
              Discard Changes
            </StudioButton>
          </div>
        </div>
      </ModalDialog>

      {/* OFFICIAL RECORD CORRECTION REQUEST MODAL */}
      <ModalDialog
        open={showCorrectionModal}
        onClose={() => setShowCorrectionModal(false)}
        title="Request Official Record Correction"
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleSubmitCorrection} className="space-y-4">
          <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
            Institutional role, official designation, operational team, tenure, and verification
            status are governed by EDC AITR leadership. Submit a correction request below to log it
            for administrative review.
          </p>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[var(--ink-secondary)]">
              Protected Field
            </label>
            <select
              value={correctionField}
              onChange={(e) => setCorrectionField(e.target.value as ProfileCorrectionRequest['field'])}
              className="w-full px-3 py-2 text-sm rounded-[8px] bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--color-2-mood)] focus:outline-none focus:border-[#C01E30]"
            >
              <option value="designation">Official Designation</option>
              <option value="role">Assigned Portal Role</option>
              <option value="operationalTeam">Operational Team Unit</option>
              <option value="tenure">Tenure Classification</option>
              <option value="email">Institutional Email</option>
              <option value="verification">Verification Status</option>
            </select>
            <p className="text-[11px] text-[var(--ink-muted)]">
              Current recorded value:{' '}
              <span className="font-medium text-[var(--color-2-mood)]">
                {getCurrentValueForCorrectionField(correctionField)}
              </span>
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[var(--ink-secondary)]">
              Requested Correction <span className="text-[#C01E30]">*</span>
            </label>
            <input
              type="text"
              required
              value={correctionRequestedValue}
              onChange={(e) => setCorrectionRequestedValue(e.target.value)}
              placeholder="Enter the accurate official value"
              className="w-full px-3 py-2 text-sm rounded-[8px] bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--color-2-mood)] focus:outline-none focus:border-[#C01E30]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[var(--ink-secondary)]">
              Reason / Reference <span className="text-[#C01E30]">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={correctionReason}
              onChange={(e) => setCorrectionReason(e.target.value)}
              placeholder="Briefly explain the appointment, transfer, or institutional record update..."
              className="w-full px-3 py-2 text-sm rounded-[8px] bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--color-2-mood)] focus:outline-none focus:border-[#C01E30]"
            />
          </div>

          {correctionError && (
            <p className="text-xs text-[#C01E30] dark:text-[#F87171]">{correctionError}</p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-hairline)]">
            <StudioButton variant="ghost" size="sm" onClick={() => setShowCorrectionModal(false)}>
              Cancel
            </StudioButton>
            <StudioButton type="submit" variant="primary" size="sm">
              Submit Request
            </StudioButton>
          </div>
        </form>
      </ModalDialog>

      {/* PUBLIC PROFILE PREVIEW MODAL */}
      <ModalDialog
        open={showPublicPreviewModal}
        onClose={() => setShowPublicPreviewModal(false)}
        title="Public Profile Preview"
        maxWidthClass="max-w-2xl"
      >
        <div className="space-y-5">
          <div className="p-3 rounded-[8px] bg-[var(--surface-subtle)] border border-[var(--border-hairline)] text-xs text-[var(--ink-secondary)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>
              {isPublicProfileEnabled
                ? `Live at ${publicUrlPath} · showing fields permitted for Public viewers.`
                : `Currently ${visibilityLabel}. This preview shows what unauthenticated visitors would see if you switch to Public Profile.`}
            </span>
            {isPublicProfileEnabled && (
              <StudioButton
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowPublicPreviewModal(false);
                  navigate(publicUrlPath);
                }}
              >
                <span>Open Route</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </StudioButton>
            )}
          </div>

          {publicPreviewProjection.profile && (
            <div className="space-y-5 p-5 rounded-[10px] border border-[var(--border-hairline)] bg-[var(--surface)]">
              <div className="flex items-start gap-4">
                <MemberAvatar
                  name={publicPreviewProjection.profile.displayName}
                  avatarUrl={publicPreviewProjection.profile.avatarUrl}
                  avatarPosition={publicPreviewProjection.profile.avatarPosition}
                  size="lg"
                />
                <div className="min-w-0 space-y-1">
                  <p className="font-mono-data text-[10px] uppercase tracking-[0.14em] text-[#C01E30] dark:text-[#F87171]">
                    EDC AITR · {publicPreviewProjection.profile.roleLabel}
                  </p>
                  <h3 className="text-xl font-display font-semibold text-[var(--color-2-mood)]">
                    {publicPreviewProjection.profile.displayName}
                  </h3>
                  {publicPreviewProjection.profile.designation && (
                    <p className="text-sm text-[var(--ink-secondary)]">
                      {publicPreviewProjection.profile.designation}
                    </p>
                  )}
                  <p className="text-xs text-[var(--ink-muted)]">
                    {[
                      publicPreviewProjection.profile.department,
                      publicPreviewProjection.profile.batch
                        ? publicPreviewProjection.profile.batch === 'Faculty'
                          ? 'Faculty'
                          : `Batch ${publicPreviewProjection.profile.batch}`
                        : null,
                      publicPreviewProjection.profile.city,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
              </div>

              {publicPreviewProjection.profile.bio ? (
                <p className="text-sm text-[var(--ink-secondary)] leading-relaxed border-t border-[var(--border-hairline)] pt-4">
                  {publicPreviewProjection.profile.bio}
                </p>
              ) : (
                <p className="text-xs text-[var(--ink-muted)] italic border-t border-[var(--border-hairline)] pt-4">
                  Biography is currently hidden or not set for public viewers.
                </p>
              )}

              {publicPreviewProjection.profile.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {publicPreviewProjection.profile.skills.map((sk) => (
                    <span
                      key={sk}
                      className="px-2 py-0.5 rounded-[5px] text-[11px] bg-[var(--surface-subtle)] border border-[var(--border-hairline)] text-[var(--ink-secondary)]"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-[11px] text-[var(--ink-muted)] pt-3 border-t border-[var(--border-hairline)]">
                Private fields (email, phone, internal IDs, and hidden company/link fields) are
                strictly excluded from public projection.
              </p>
            </div>
          )}
        </div>
      </ModalDialog>
    </div>
  );
};
