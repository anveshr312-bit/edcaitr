'use client';

import React from 'react';
import { useResolvedMediaUrl } from '../../utils/mediaStorage';

export interface MemberAvatarProps {
  name: string;
  avatarUrl?: string;
  avatarPosition?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'rounded' | 'circle';
  tone?: 'crimson' | 'obsidian' | 'neutral';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<MemberAvatarProps['size']>, string> = {
  xs: 'h-5 w-5 text-[9px]',
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 sm:h-24 sm:w-24 text-2xl',
};

const TONE_CLASSES: Record<NonNullable<MemberAvatarProps['tone']>, string> = {
  crimson: 'bg-[#C01E30] text-white border-[#C01E30]/30',
  obsidian: 'bg-[#121214] dark:bg-[#232327] text-white border-[var(--border-strong)]',
  neutral: 'bg-[var(--surface-subtle)] text-[var(--color-2-mood)] border-[var(--border-strong)]',
};

export const MemberAvatar: React.FC<MemberAvatarProps> = ({
  name,
  avatarUrl,
  avatarPosition = '50% 50%',
  size = 'md',
  shape = 'rounded',
  tone = 'obsidian',
  className = '',
}) => {
  const { resolvedUrl } = useResolvedMediaUrl(avatarUrl);
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'ED';

  const shapeClass =
    shape === 'circle'
      ? 'rounded-full'
      : size === 'xl'
        ? 'rounded-[12px]'
        : size === 'lg'
          ? 'rounded-[10px]'
          : 'rounded-[8px]';

  if (resolvedUrl) {
    return (
      <span
        className={`relative inline-flex shrink-0 overflow-hidden border border-[var(--border-strong)] bg-[var(--surface-subtle)] select-none ${SIZE_CLASSES[size]} ${shapeClass} ${className}`}
      >
        <img
          src={resolvedUrl}
          alt={name}
          className="h-full w-full object-cover"
          style={{ objectPosition: avatarPosition }}
        />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center font-display font-semibold tracking-tight border select-none ${SIZE_CLASSES[size]} ${shapeClass} ${TONE_CLASSES[tone]} ${className}`}
    >
      {initials}
    </span>
  );
};
