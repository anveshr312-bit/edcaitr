import { SkeletonBox } from '../../../components/ui/Skeleton';

export default function EventDetailLoading() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,3fr) minmax(0,2fr)', gap: 32, alignItems: 'start' }}>
      <div style={{ display: 'grid', gap: 20 }}>
        <SkeletonBox width="70%" height={38} />
        <SkeletonBox width="100%" height={300} borderRadius={12} />
        <SkeletonBox width="100%" height={16} />
        <SkeletonBox width="92%" height={16} />
        <SkeletonBox width="64%" height={16} />
      </div>
      <div className="card" style={{ gap: 16 }}>
        <SkeletonBox width={140} height={24} />
        <SkeletonBox width="100%" height={18} />
        <SkeletonBox width="80%" height={18} />
        <SkeletonBox width="100%" height={44} borderRadius={999} />
      </div>
    </div>
  );
}
