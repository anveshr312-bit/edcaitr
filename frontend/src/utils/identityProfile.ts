import {
  FieldVisibilitySetting,
  OperationalTeamCode,
  ProfileFieldVisibility,
  ProfileVisibilityLevel,
  UserProfile,
  UserRole,
} from '../types/portal';

export type IdentitySectionId =
  | 'personal'
  | 'affiliation'
  | 'professional'
  | 'skills'
  | 'links'
  | 'privacy'
  | 'security';

export interface ProfileCompletionItem {
  id: string;
  label: string;
  sectionId: IdentitySectionId;
  weight: number;
  completed: boolean;
}

export interface ProfileCompletionSummary {
  percentage: number;
  completedCount: number;
  totalCount: number;
  items: ProfileCompletionItem[];
  missingItems: ProfileCompletionItem[];
}

export interface ProjectedMemberProfile {
  id: string;
  role: UserRole;
  roleLabel: string;
  verified: boolean;
  visibility: ProfileVisibilityLevel;
  displayName: string;
  avatarUrl?: string;
  avatarPosition?: string;
  designation?: string;
  department?: string;
  batch?: string;
  city?: string;
  operationalTeam?: OperationalTeamCode;
  tenure?: 'current' | 'past';
  pastEdcRole?: string;
  teamPosition?: string;
  bio?: string;
  company?: string;
  industry?: string;
  startupName?: string;
  startupStage?: UserProfile['startupStage'];
  companyWebsite?: string;
  openToMentorship?: boolean;
  mentorshipDomains?: string[];
  leadershipIntro?: string;
  institutionalResponsibilities?: string[];
  professionalBackground?: string;
  experienceSummary?: string;
  publicAchievements?: string[];
  areasOfResponsibility?: string[];
  expertiseDomains?: string[];
  mentorshipAreas?: string[];
  college?: string;
  course?: string;
  academicYear?: string;
  personalProjects?: string;
  startupInterests?: string;
  skills: string[];
  interests: string[];
  linkedin?: string;
  websiteUrl?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  // Never exposed on unauthenticated public routes; only permitted if viewer is EDC member AND user explicitly enabled it
  email?: string;
  phone?: string;
}

export interface MemberProfileProjectionResult {
  allowed: boolean;
  reason?: 'not_found' | 'private' | 'members_only';
  accessLevel?: 'owner' | 'admin_preview' | 'edc_member' | 'public';
  profile?: ProjectedMemberProfile;
}

/**
 * Safe institutional privacy defaults:
 * - Basic identity & EDC affiliation default to EDC Members Only
 * - Sensitive contact details (phone, email) and external career/company info default to Private
 */
export const DEFAULT_FIELD_VISIBILITY: ProfileFieldVisibility = {
  fullName: 'edc_members',
  avatar: 'edc_members',
  designation: 'edc_members',
  department: 'edc_members',
  bio: 'edc_members',
  linkedin: 'private',
  phone: 'private',
  email: 'private',
  company: 'private',
  startup: 'private',
  links: 'private',
};

export const PROTECTED_FIELDS_BY_ROLE: Record<UserRole, string[]> = {
  director: ['id', 'email', 'role', 'designation', 'verified', 'tenure'],
  core_team: ['id', 'email', 'role', 'designation', 'operationalTeam', 'verified', 'tenure'],
  advisor: ['id', 'email', 'role', 'operationalTeam', 'verified', 'tenure'],
  alumni: ['id', 'email', 'role', 'verified', 'tenure'],
  participant: ['id', 'email', 'role', 'verified', 'tenure'],
};

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'director':
      return 'Director';
    case 'core_team':
      return 'Core Team Member';
    case 'advisor':
      return 'Faculty Advisor';
    case 'alumni':
      return 'Verified Alumni';
    case 'participant':
    default:
      return 'Student Participant';
  }
}

export function getRoleShortBadge(role: UserRole): string {
  switch (role) {
    case 'director':
      return 'DIRECTOR · GOVERNANCE';
    case 'core_team':
      return 'CORE TEAM · OPERATIONS';
    case 'advisor':
      return 'FACULTY ADVISOR';
    case 'alumni':
      return 'ALUMNI NETWORK';
    case 'participant':
    default:
      return 'STUDENT MEMBER';
  }
}

export function getEffectiveProfileVisibility(user: UserProfile): ProfileVisibilityLevel {
  return user.profileVisibility ?? 'edc_members';
}

export function getEffectiveFieldVisibility(user: UserProfile): ProfileFieldVisibility {
  return {
    ...DEFAULT_FIELD_VISIBILITY,
    ...(user.fieldVisibility ?? {}),
  };
}

export function isOfficialDesignationProtected(role: UserRole): boolean {
  return role === 'director' || role === 'core_team';
}

export function normalizeUrlInput(raw?: string): { value: string; valid: boolean; error?: string } {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) {
    return { value: '', valid: true };
  }
  try {
    const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return { value: trimmed, valid: false, error: 'URL must use http:// or https://' };
    }
    if (!parsed.hostname.includes('.')) {
      return { value: trimmed, valid: false, error: 'Please enter a valid domain name.' };
    }
    return { value: parsed.toString(), valid: true };
  } catch {
    return { value: trimmed, valid: false, error: 'Enter a valid URL (e.g. https://linkedin.com/in/name).' };
  }
}

export function normalizeStringList(items?: string[]): string[] {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();
  const cleaned: string[] = [];
  for (const item of items) {
    const trimmed = String(item ?? '').trim().slice(0, 64);
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push(trimmed);
  }
  return cleaned.slice(0, 20);
}

/**
 * Computes weighted, role-aware profile completion without punishing participants
 * for optional founder/startup fields.
 */
export function calculateProfileCompletion(user: UserProfile): ProfileCompletionSummary {
  const items: ProfileCompletionItem[] = [
    {
      id: 'name',
      label: 'Full name',
      sectionId: 'personal',
      weight: 10,
      completed: Boolean(user.name?.trim()),
    },
    {
      id: 'avatar',
      label: 'Profile photograph',
      sectionId: 'personal',
      weight: 12,
      completed: Boolean(user.avatarUrl),
    },
    {
      id: 'bio',
      label: 'Short biography',
      sectionId: 'personal',
      weight: 14,
      completed: Boolean(user.bio && user.bio.trim().length >= 20),
    },
    {
      id: 'city',
      label: 'City & location',
      sectionId: 'personal',
      weight: 6,
      completed: Boolean(user.city?.trim()),
    },
    {
      id: 'skills',
      label: 'Skills & strengths',
      sectionId: 'skills',
      weight: 12,
      completed: Boolean(user.skills && user.skills.length >= 2),
    },
    {
      id: 'interests',
      label: 'Areas of interest',
      sectionId: 'skills',
      weight: 8,
      completed: Boolean(user.interests && user.interests.length >= 1),
    },
    {
      id: 'linkedin',
      label: 'LinkedIn or portfolio link',
      sectionId: 'links',
      weight: 10,
      completed: Boolean(
        (user.linkedin && user.linkedin !== 'https://linkedin.com' && user.linkedin.trim().length > 10) ||
          user.portfolioUrl?.trim() ||
          user.websiteUrl?.trim() ||
          user.githubUrl?.trim()
      ),
    },
  ];

  // Role-specific meaningful fields
  if (user.role === 'director') {
    items.push(
      {
        id: 'leadershipIntro',
        label: 'Leadership introduction',
        sectionId: 'professional',
        weight: 10,
        completed: Boolean(user.leadershipIntro?.trim()),
      },
      {
        id: 'institutionalResponsibilities',
        label: 'Institutional responsibilities',
        sectionId: 'professional',
        weight: 9,
        completed: Boolean(user.institutionalResponsibilities && user.institutionalResponsibilities.length > 0),
      },
      {
        id: 'publicAchievements',
        label: 'Public institutional achievements',
        sectionId: 'professional',
        weight: 9,
        completed: Boolean(user.publicAchievements && user.publicAchievements.length > 0),
      }
    );
  } else if (user.role === 'core_team') {
    items.push(
      {
        id: 'teamPosition',
        label: 'Position within operational team',
        sectionId: 'affiliation',
        weight: 10,
        completed: Boolean(user.teamPosition?.trim()),
      },
      {
        id: 'areasOfResponsibility',
        label: 'Areas of responsibility',
        sectionId: 'professional',
        weight: 10,
        completed: Boolean(user.areasOfResponsibility && user.areasOfResponsibility.length > 0),
      },
      {
        id: 'department',
        label: 'Department & academic batch',
        sectionId: 'affiliation',
        weight: 8,
        completed: Boolean(user.department?.trim() && user.batch?.trim()),
      }
    );
  } else if (user.role === 'advisor') {
    items.push(
      {
        id: 'company',
        label: 'Organization & professional designation',
        sectionId: 'professional',
        weight: 10,
        completed: Boolean(user.company?.trim() && user.designation?.trim()),
      },
      {
        id: 'expertiseDomains',
        label: 'Expertise domains',
        sectionId: 'professional',
        weight: 9,
        completed: Boolean(user.expertiseDomains && user.expertiseDomains.length > 0),
      },
      {
        id: 'mentorshipAreas',
        label: 'Mentorship focus areas',
        sectionId: 'professional',
        weight: 9,
        completed: Boolean(user.mentorshipAreas && user.mentorshipAreas.length > 0),
      }
    );
  } else if (user.role === 'alumni') {
    items.push(
      {
        id: 'company',
        label: 'Current company & designation',
        sectionId: 'professional',
        weight: 12,
        completed: Boolean(user.company?.trim() && user.designation?.trim()),
      },
      {
        id: 'pastEdcRole',
        label: 'Past EDC role & graduation batch',
        sectionId: 'affiliation',
        weight: 8,
        completed: Boolean(user.pastEdcRole?.trim() && user.batch?.trim()),
      },
      {
        id: 'experienceSummary',
        label: 'Professional journey or venture summary',
        sectionId: 'professional',
        weight: 8,
        completed: Boolean(user.experienceSummary?.trim() || user.startupName?.trim()),
      }
    );
  } else {
    // Participant — approachable & student-friendly
    items.push(
      {
        id: 'college',
        label: 'College, course & academic year',
        sectionId: 'professional',
        weight: 12,
        completed: Boolean((user.college?.trim() || user.department?.trim()) && user.batch?.trim()),
      },
      {
        id: 'personalProjects',
        label: 'Projects or startup interests',
        sectionId: 'professional',
        weight: 16,
        completed: Boolean(user.personalProjects?.trim() || user.startupInterests?.trim()),
      }
    );
  }

  const totalWeight = items.reduce((acc, item) => acc + item.weight, 0);
  const earnedWeight = items.reduce((acc, item) => acc + (item.completed ? item.weight : 0), 0);
  const percentage = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
  const completedCount = items.filter((item) => item.completed).length;

  return {
    percentage,
    completedCount,
    totalCount: items.length,
    items,
    missingItems: items.filter((item) => !item.completed),
  };
}

export type EditableProfilePatch = Partial<
  Omit<UserProfile, 'id' | 'email' | 'role' | 'verified' | 'operationalTeam' | 'tenure' | 'mfaEnabled'>
>;

/**
 * Enforces ownership & strips any protected institutional fields before persisting to PortalContext.
 */
export function sanitizeProfileUpdatePayload(
  currentUser: UserProfile,
  rawPatch: Record<string, unknown>
): { ok: true; nextUser: UserProfile } | { ok: false; error: string } {
  const name = typeof rawPatch.name === 'string' ? rawPatch.name.trim() : currentUser.name;
  if (!name || name.length < 2) {
    return { ok: false, error: 'Full name must be at least 2 characters.' };
  }
  if (name.length > 80) {
    return { ok: false, error: 'Full name cannot exceed 80 characters.' };
  }

  const linkedinCheck = normalizeUrlInput(
    typeof rawPatch.linkedin === 'string' ? rawPatch.linkedin : currentUser.linkedin
  );
  if (!linkedinCheck.valid) {
    return { ok: false, error: `LinkedIn URL: ${linkedinCheck.error}` };
  }

  const websiteCheck = normalizeUrlInput(
    typeof rawPatch.websiteUrl === 'string' ? rawPatch.websiteUrl : currentUser.websiteUrl
  );
  if (!websiteCheck.valid) {
    return { ok: false, error: `Personal Website: ${websiteCheck.error}` };
  }

  const portfolioCheck = normalizeUrlInput(
    typeof rawPatch.portfolioUrl === 'string' ? rawPatch.portfolioUrl : currentUser.portfolioUrl
  );
  if (!portfolioCheck.valid) {
    return { ok: false, error: `Portfolio URL: ${portfolioCheck.error}` };
  }

  const githubCheck = normalizeUrlInput(
    typeof rawPatch.githubUrl === 'string' ? rawPatch.githubUrl : currentUser.githubUrl
  );
  if (!githubCheck.valid) {
    return { ok: false, error: `GitHub URL: ${githubCheck.error}` };
  }

  const companyWebsiteCheck = normalizeUrlInput(
    typeof rawPatch.companyWebsite === 'string' ? rawPatch.companyWebsite : currentUser.companyWebsite
  );
  if (!companyWebsiteCheck.valid) {
    return { ok: false, error: `Company Website: ${companyWebsiteCheck.error}` };
  }

  // Protected fields are NEVER overridden from user input
  const designation = isOfficialDesignationProtected(currentUser.role)
    ? currentUser.designation
    : typeof rawPatch.designation === 'string' && rawPatch.designation.trim()
      ? rawPatch.designation.trim().slice(0, 110)
      : currentUser.designation;

  const allowedVisibilities: ProfileVisibilityLevel[] = ['private', 'edc_members', 'public'];
  const profileVisibility: ProfileVisibilityLevel =
    typeof rawPatch.profileVisibility === 'string' &&
    allowedVisibilities.includes(rawPatch.profileVisibility as ProfileVisibilityLevel)
      ? (rawPatch.profileVisibility as ProfileVisibilityLevel)
      : getEffectiveProfileVisibility(currentUser);

  const incomingFieldVis =
    rawPatch.fieldVisibility && typeof rawPatch.fieldVisibility === 'object'
      ? (rawPatch.fieldVisibility as Partial<ProfileFieldVisibility>)
      : {};
  const mergedFieldVis: ProfileFieldVisibility = {
    ...getEffectiveFieldVisibility(currentUser),
  };
  (Object.keys(DEFAULT_FIELD_VISIBILITY) as (keyof ProfileFieldVisibility)[]).forEach((key) => {
    const val = incomingFieldVis[key];
    if (val === 'private' || val === 'edc_members' || val === 'public') {
      // Email and phone may never be promoted to 'public' on unauthenticated profiles
      if ((key === 'email' || key === 'phone') && val === 'public') {
        mergedFieldVis[key] = 'edc_members';
      } else {
        mergedFieldVis[key] = val;
      }
    }
  });

  const cleanStr = (val: unknown, fallback?: string, max = 240): string | undefined => {
    if (val === undefined) return fallback;
    if (typeof val !== 'string') return fallback;
    const t = val.trim();
    return t ? t.slice(0, max) : undefined;
  };

  const nextUser: UserProfile = {
    ...currentUser,
    // Strictly preserve immutable/protected fields
    id: currentUser.id,
    email: currentUser.email,
    role: currentUser.role,
    verified: currentUser.verified,
    operationalTeam: currentUser.operationalTeam,
    tenure: currentUser.tenure,
    mfaEnabled: currentUser.mfaEnabled,
    // Sanitized editable fields
    name,
    preferredName: cleanStr(rawPatch.preferredName, currentUser.preferredName, 60),
    designation,
    department: cleanStr(rawPatch.department, currentUser.department, 100) ?? currentUser.department,
    batch: cleanStr(rawPatch.batch, currentUser.batch, 30) ?? currentUser.batch,
    city: cleanStr(rawPatch.city, currentUser.city, 60) ?? currentUser.city,
    phone: cleanStr(rawPatch.phone, currentUser.phone, 28),
    bio: cleanStr(rawPatch.bio, currentUser.bio, 500),
    avatarUrl:
      rawPatch.avatarUrl === null || rawPatch.avatarUrl === ''
        ? undefined
        : typeof rawPatch.avatarUrl === 'string'
          ? rawPatch.avatarUrl
          : currentUser.avatarUrl,
    avatarPosition:
      typeof rawPatch.avatarPosition === 'string'
        ? rawPatch.avatarPosition
        : currentUser.avatarPosition,
    avatarMeta:
      rawPatch.avatarUrl === null || rawPatch.avatarUrl === ''
        ? undefined
        : rawPatch.avatarMeta !== undefined
          ? (rawPatch.avatarMeta as UserProfile['avatarMeta'])
          : currentUser.avatarMeta,
    industry: cleanStr(rawPatch.industry, currentUser.industry, 80) ?? currentUser.industry,
    company: cleanStr(rawPatch.company, currentUser.company, 100),
    pastEdcRole: cleanStr(rawPatch.pastEdcRole, currentUser.pastEdcRole, 100),
    startupStage:
      typeof rawPatch.startupStage === 'string'
        ? (rawPatch.startupStage as UserProfile['startupStage'])
        : currentUser.startupStage,
    linkedin: linkedinCheck.value || '',
    websiteUrl: websiteCheck.value || undefined,
    portfolioUrl: portfolioCheck.value || undefined,
    githubUrl: githubCheck.value || undefined,
    skills:
      rawPatch.skills !== undefined
        ? normalizeStringList(rawPatch.skills as string[])
        : currentUser.skills,
    interests:
      rawPatch.interests !== undefined
        ? normalizeStringList(rawPatch.interests as string[])
        : currentUser.interests,
    // Role-specific editable fields
    leadershipIntro: cleanStr(rawPatch.leadershipIntro, currentUser.leadershipIntro, 600),
    institutionalResponsibilities:
      rawPatch.institutionalResponsibilities !== undefined
        ? normalizeStringList(rawPatch.institutionalResponsibilities as string[])
        : currentUser.institutionalResponsibilities,
    professionalBackground: cleanStr(rawPatch.professionalBackground, currentUser.professionalBackground, 600),
    experienceSummary: cleanStr(rawPatch.experienceSummary, currentUser.experienceSummary, 600),
    publicAchievements:
      rawPatch.publicAchievements !== undefined
        ? normalizeStringList(rawPatch.publicAchievements as string[])
        : currentUser.publicAchievements,
    teamPosition: cleanStr(rawPatch.teamPosition, currentUser.teamPosition, 90),
    areasOfResponsibility:
      rawPatch.areasOfResponsibility !== undefined
        ? normalizeStringList(rawPatch.areasOfResponsibility as string[])
        : currentUser.areasOfResponsibility,
    expertiseDomains:
      rawPatch.expertiseDomains !== undefined
        ? normalizeStringList(rawPatch.expertiseDomains as string[])
        : currentUser.expertiseDomains,
    mentorshipAreas:
      rawPatch.mentorshipAreas !== undefined
        ? normalizeStringList(rawPatch.mentorshipAreas as string[])
        : currentUser.mentorshipAreas,
    startupName: cleanStr(rawPatch.startupName, currentUser.startupName, 100),
    companyWebsite: companyWebsiteCheck.value || undefined,
    openToMentorship:
      typeof rawPatch.openToMentorship === 'boolean'
        ? rawPatch.openToMentorship
        : currentUser.openToMentorship,
    mentorshipDomains:
      rawPatch.mentorshipDomains !== undefined
        ? normalizeStringList(rawPatch.mentorshipDomains as string[])
        : currentUser.mentorshipDomains,
    college: cleanStr(rawPatch.college, currentUser.college, 120),
    course: cleanStr(rawPatch.course, currentUser.course, 80),
    academicYear: cleanStr(rawPatch.academicYear, currentUser.academicYear, 40),
    personalProjects: cleanStr(rawPatch.personalProjects, currentUser.personalProjects, 500),
    startupInterests: cleanStr(rawPatch.startupInterests, currentUser.startupInterests, 400),
    profileVisibility,
    fieldVisibility: mergedFieldVis,
    updatedAt: new Date().toISOString(),
  };

  return { ok: true, nextUser };
}

function isFieldVisibleAtLevel(
  setting: FieldVisibilitySetting,
  effectiveAudience: 'public' | 'edc_member'
): boolean {
  if (setting === 'private') return false;
  if (effectiveAudience === 'public') return setting === 'public';
  // Authenticated EDC members can view fields marked 'edc_members' or 'public'
  return setting === 'edc_members' || setting === 'public';
}

/**
 * Data-access privacy projection layer.
 * Ensures unauthorized viewers, directories, and public `/members/:id` routes
 * never receive private records or private fields.
 */
export function getProjectedMemberProfile(
  targetUser: UserProfile | undefined | null,
  viewer: UserProfile | null,
  context: 'public_route' | 'directory' | 'preview_public'
): MemberProfileProjectionResult {
  if (!targetUser) {
    return { allowed: false, reason: 'not_found' };
  }

  const visibility = getEffectiveProfileVisibility(targetUser);
  const fieldVis = getEffectiveFieldVisibility(targetUser);
  const isOwner = Boolean(viewer && viewer.id === targetUser.id);
  const isAdminViewer = Boolean(viewer && (viewer.role === 'director' || viewer.role === 'advisor'));

  if (context === 'preview_public') {
    return {
      allowed: true,
      accessLevel: 'public',
      profile: buildProjectedProfile(targetUser, fieldVis, 'public', visibility),
    };
  }

  if (visibility === 'private') {
    if (isOwner) {
      return {
        allowed: true,
        accessLevel: 'owner',
        profile: buildProjectedProfile(targetUser, fieldVis, 'edc_member', visibility),
      };
    }
    if (isAdminViewer && context === 'public_route') {
      return {
        allowed: true,
        accessLevel: 'admin_preview',
        profile: buildProjectedProfile(targetUser, fieldVis, 'edc_member', visibility),
      };
    }
    return { allowed: false, reason: 'private' };
  }

  if (visibility === 'edc_members') {
    if (!viewer) {
      return { allowed: false, reason: 'members_only' };
    }
    return {
      allowed: true,
      accessLevel: isOwner ? 'owner' : 'edc_member',
      profile: buildProjectedProfile(targetUser, fieldVis, 'edc_member', visibility),
    };
  }

  // visibility === 'public'
  const audience: 'public' | 'edc_member' =
    context === 'public_route' && !viewer ? 'public' : viewer ? 'edc_member' : 'public';

  return {
    allowed: true,
    accessLevel: isOwner ? 'owner' : audience === 'public' ? 'public' : 'edc_member',
    profile: buildProjectedProfile(targetUser, fieldVis, audience, visibility),
  };
}

function buildProjectedProfile(
  user: UserProfile,
  fieldVis: ProfileFieldVisibility,
  audience: 'public' | 'edc_member',
  visibility: ProfileVisibilityLevel
): ProjectedMemberProfile {
  const showName = isFieldVisibleAtLevel(fieldVis.fullName, audience) || audience === 'public';
  const showAvatar = isFieldVisibleAtLevel(fieldVis.avatar, audience);
  const showDesignation = isFieldVisibleAtLevel(fieldVis.designation, audience);
  const showDepartment = isFieldVisibleAtLevel(fieldVis.department, audience);
  const showBio = isFieldVisibleAtLevel(fieldVis.bio, audience);
  const showLinkedin = isFieldVisibleAtLevel(fieldVis.linkedin, audience);
  const showCompany = isFieldVisibleAtLevel(fieldVis.company, audience);
  const showStartup = isFieldVisibleAtLevel(fieldVis.startup, audience);
  const showLinks = isFieldVisibleAtLevel(fieldVis.links, audience);

  // Email and Phone are STRICTLY NEVER included for unauthenticated public audience
  const showEmail = audience === 'edc_member' && isFieldVisibleAtLevel(fieldVis.email, 'edc_member');
  const showPhone = audience === 'edc_member' && isFieldVisibleAtLevel(fieldVis.phone, 'edc_member');

  const safeLinkedin =
    showLinkedin && user.linkedin && user.linkedin !== 'https://linkedin.com'
      ? user.linkedin
      : undefined;

  return {
    id: user.id,
    role: user.role,
    roleLabel: getRoleLabel(user.role),
    verified: Boolean(user.verified),
    visibility,
    displayName: showName ? user.preferredName || user.name : 'EDC AITR Member',
    avatarUrl: showAvatar ? user.avatarUrl : undefined,
    avatarPosition: showAvatar ? user.avatarPosition : undefined,
    designation: showDesignation ? user.designation : undefined,
    department: showDepartment ? user.department : undefined,
    batch: user.batch,
    city: user.city,
    operationalTeam: user.operationalTeam,
    tenure: user.tenure,
    pastEdcRole: user.pastEdcRole,
    teamPosition: user.teamPosition,
    bio: showBio ? user.bio : undefined,
    company: showCompany ? user.company : undefined,
    industry: showCompany || showStartup ? user.industry : undefined,
    startupName: showStartup ? user.startupName : undefined,
    startupStage: showStartup ? user.startupStage : undefined,
    companyWebsite: showCompany || showStartup ? user.companyWebsite : undefined,
    openToMentorship: user.openToMentorship,
    mentorshipDomains: user.openToMentorship ? user.mentorshipDomains ?? [] : undefined,
    leadershipIntro: showBio ? user.leadershipIntro : undefined,
    institutionalResponsibilities: user.institutionalResponsibilities,
    professionalBackground: showBio ? user.professionalBackground : undefined,
    experienceSummary: showBio || showCompany ? user.experienceSummary : undefined,
    publicAchievements: user.publicAchievements,
    areasOfResponsibility: user.areasOfResponsibility,
    expertiseDomains: user.expertiseDomains,
    mentorshipAreas: user.mentorshipAreas,
    college: showDepartment ? user.college : undefined,
    course: showDepartment ? user.course : undefined,
    academicYear: showDepartment ? user.academicYear : undefined,
    personalProjects: showBio ? user.personalProjects : undefined,
    startupInterests: showBio || showStartup ? user.startupInterests : undefined,
    skills: user.skills ?? [],
    interests: user.interests ?? [],
    linkedin: safeLinkedin,
    websiteUrl: showLinks ? user.websiteUrl : undefined,
    portfolioUrl: showLinks ? user.portfolioUrl : undefined,
    githubUrl: showLinks ? user.githubUrl : undefined,
    email: showEmail ? user.email : undefined,
    phone: showPhone ? user.phone : undefined,
  };
}

export function canUserAppearInDirectory(targetUser: UserProfile, viewer: UserProfile | null): boolean {
  const vis = getEffectiveProfileVisibility(targetUser);
  if (vis === 'private') {
    return Boolean(viewer && viewer.id === targetUser.id);
  }
  return true;
}

export function getPublicProfilePath(userId: string): string {
  return `/members/${encodeURIComponent(userId)}`;
}
