import React from 'react';

/**
 * SkeletonBox: Theme-aware, subtle animated shimmer box
 */
export function SkeletonBox({
  width = '100%',
  height = 16,
  borderRadius = 8,
  className = '',
  style,
}: {
  width?: string | number;
  height?: string | number;
  borderRadius?: number | string;
  dark?: boolean; // Deprecated, kept for backward compatibility
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      aria-hidden="true"
      className={`skeleton rounded-lg ${className}`}
      style={{ width, height, borderRadius, ...style }}
    />
  );
}

/**
 * PageHeaderSkeleton: Clean, neutral, theme-aware hero banner skeleton.
 * Completely eliminates the harsh black column.
 */
export function PageHeaderSkeleton({ titleWidth = 260 }: { titleWidth?: number }) {
  return (
    <div
      aria-hidden="true"
      className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface-subtle)]/70 p-6 sm:p-10 mb-8 space-y-4"
    >
      <div className="flex items-center gap-2">
        <SkeletonBox width={16} height={16} borderRadius={999} />
        <SkeletonBox width={120} height={14} borderRadius={999} />
      </div>
      <SkeletonBox width={titleWidth} height={40} borderRadius={10} />
      <SkeletonBox width="60%" height={16} borderRadius={6} />
    </div>
  );
}

/**
 * Alias for backward compatibility - no longer renders a pitch-black box.
 */
export const DarkHeaderSkeleton = PageHeaderSkeleton;

/**
 * CardGridSkeleton: Frosted, clean skeleton cards with subtle hairline borders.
 */
export function CardGridSkeleton({
  count = 6,
  hasPoster = false,
}: {
  count?: number;
  hasPoster?: boolean;
}) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
      aria-busy="true"
      aria-label="Loading content"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--surface)] p-6 space-y-4 shadow-xs"
        >
          {hasPoster && (
            <SkeletonBox height={180} borderRadius={12} className="w-full" />
          )}
          <div className="flex items-center justify-between">
            <SkeletonBox width={84} height={20} borderRadius={999} />
            <SkeletonBox width={50} height={16} borderRadius={6} />
          </div>
          <SkeletonBox width="85%" height={24} borderRadius={8} />
          <div className="space-y-2 pt-1">
            <SkeletonBox width="100%" height={14} borderRadius={6} />
            <SkeletonBox width="65%" height={14} borderRadius={6} />
          </div>
          <div className="pt-2">
            <SkeletonBox width={120} height={34} borderRadius={999} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default SkeletonBox;
