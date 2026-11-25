import React from 'react';

export function SkeletonBox({
  width = '100%',
  height = 16,
  borderRadius = 6,
  dark = false,
  style,
}: {
  width?: string | number;
  height?: string | number;
  borderRadius?: number | string;
  dark?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      aria-hidden="true"
      className={dark ? 'skeleton-dark' : 'skeleton'}
      style={{ width, height, borderRadius, ...style }}
    />
  );
}

export function CardGridSkeleton({ count = 6, hasPoster = false }: { count?: number; hasPoster?: boolean }) {
  return (
    <div className="grid" aria-busy="true" aria-label="Loading content">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card" style={{ gap: 14 }}>
          {hasPoster && <SkeletonBox height={180} borderRadius={8} />}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SkeletonBox width={84} height={22} borderRadius={4} />
            <SkeletonBox width={48} height={16} />
          </div>
          <SkeletonBox width="78%" height={22} />
          <SkeletonBox width="100%" height={14} />
          <SkeletonBox width="62%" height={14} />
          <SkeletonBox width={120} height={34} borderRadius={999} style={{ marginTop: 6 }} />
        </div>
      ))}
    </div>
  );
}

export function DarkHeaderSkeleton({ titleWidth = 220 }: { titleWidth?: number }) {
  return (
    <div
      aria-hidden="true"
      style={{
        background: 'var(--color-2-mood)',
        padding: '48px 36px',
        marginLeft: -24,
        marginRight: -24,
        marginTop: -24,
        marginBottom: 36,
      }}
    >
      <SkeletonBox dark width={80} height={12} style={{ marginBottom: 14 }} />
      <SkeletonBox dark width={titleWidth} height={36} style={{ marginBottom: 14 }} />
      <SkeletonBox dark width="55%" height={16} />
    </div>
  );
}
