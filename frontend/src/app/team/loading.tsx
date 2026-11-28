import { CardGridSkeleton, PageHeaderSkeleton } from '../../components/ui/Skeleton';

export default function TeamLoading() {
  return (
    <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse">
      <PageHeaderSkeleton titleWidth={220} />
      <CardGridSkeleton count={6} />
    </div>
  );
}
