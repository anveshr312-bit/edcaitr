import { CardGridSkeleton, PageHeaderSkeleton } from '../components/ui/Skeleton';

export default function RootLoading() {
  return (
    <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse">
      <PageHeaderSkeleton titleWidth={320} />
      <CardGridSkeleton count={3} />
    </div>
  );
}
