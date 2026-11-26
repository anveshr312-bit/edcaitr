'use client';

import React, { useMemo } from 'react';
import { ShieldCheck } from 'lucide-react';
import { UserProfile } from '../../types/portal';
import { useThemeToggle } from '../../context/ThemeContext';
import { useMotionSystem } from '../../context/MotionContext';
import { useResolvedMediaUrl } from '../../utils/mediaStorage';
import { getRoleLabel, getRoleShortBadge } from '../../utils/identityProfile';
import {
  createEditorialCrestDataUrl,
  EDC_FOIL_PATTERN_DATA_URL,
  ProfileCard,
} from '../ui/ProfileCard';

interface IdentityCredentialCardProps {
  user: UserProfile;
  actionLabel?: string;
  onActionClick?: () => void;
  compact?: boolean;
}

export const IdentityCredentialCard: React.FC<IdentityCredentialCardProps> = ({
  user,
  actionLabel,
  onActionClick,
  compact = false,
}) => {
  const { isDark } = useThemeToggle();
  const { reducedMotion } = useMotionSystem();
  const { resolvedUrl } = useResolvedMediaUrl(user.avatarUrl);

  const displayName = user.preferredName?.trim() || user.name;
  const roleLabel = getRoleLabel(user.role);
  const handle = useMemo(
    () =>
      displayName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '.')
        .replace(/(^\.|\.$)/g, '') || 'edc.member',
    [displayName]
  );

  const crestFallback = useMemo(
    () =>
      createEditorialCrestDataUrl({
        name: displayName,
        batch: user.batch || 'AITR',
        company:
          user.operationalTeam
            ? `EDC AITR · ${user.operationalTeam} UNIT`
            : user.company || user.department || 'EDC AITR INDORE',
        roleBadge: getRoleShortBadge(user.role),
      }),
    [displayName, user.batch, user.company, user.department, user.operationalTeam, user.role]
  );

  const credentialSubtitle = useMemo(() => {
    if (user.role === 'core_team' && user.operationalTeam) {
      return `${user.designation} · ${user.operationalTeam} Unit`;
    }
    if (user.role === 'alumni' && user.company) {
      return `${user.designation} · ${user.company}`;
    }
    return user.designation;
  }, [user.company, user.designation, user.operationalTeam, user.role]);

  const credentialStatus = useMemo(() => {
    const batchSegment =
      user.batch && user.batch !== 'Faculty' ? `Batch ${user.batch}` : user.tenure === 'current' ? 'Active Tenure' : 'Alumni Tenure';
    if (user.verified) {
      return `Verified ${roleLabel} · ${batchSegment}`;
    }
    return `${roleLabel} · ${batchSegment}`;
  }, [roleLabel, user.batch, user.tenure, user.verified]);

  const effectiveAvatar = resolvedUrl || crestFallback;

  return (
    <div className="flex flex-col items-center">
      <ProfileCard
        theme={isDark ? 'dark' : 'light'}
        avatarUrl={effectiveAvatar}
        miniAvatarUrl={effectiveAvatar}
        iconUrl={EDC_FOIL_PATTERN_DATA_URL}
        name={displayName}
        title={credentialSubtitle}
        handle={handle}
        status={credentialStatus}
        statusColor={user.verified ? '#C01E30' : '#71717A'}
        contactText={actionLabel ?? (user.verified ? 'Verified ID' : 'Member ID')}
        showUserInfo
        enableTilt={!reducedMotion}
        holo={reducedMotion ? 0 : 0.34}
        glare={reducedMotion ? 0 : 0.2}
        tiltStrength={5}
        parallax={3}
        intro={false}
        onContactClick={onActionClick}
        className={compact ? 'max-w-[300px]' : 'max-w-[330px]'}
      />

      {/* Institutional Verification Caption (strictly factual) */}
      <div className="mt-3 flex items-center justify-between w-full max-w-[330px] px-1 text-[11px] text-[var(--ink-muted)]">
        <span className="font-mono-data uppercase tracking-wider">
          EDC AITR · {user.tenure === 'current' ? 'ACTIVE' : 'ALUMNI'}
        </span>
        {user.verified ? (
          <span className="inline-flex items-center gap-1 text-[var(--color-2-mood)] font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-[#C01E30] dark:text-[#F87171]" />
            <span>Verified Record</span>
          </span>
        ) : (
          <span>Standard Member</span>
        )}
      </div>
    </div>
  );
};
