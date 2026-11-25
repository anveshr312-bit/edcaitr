import { CardGridSkeleton, DarkHeaderSkeleton } from '../../../components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <>
      <DarkHeaderSkeleton titleWidth={260} />
      <CardGridSkeleton count={4} />
    </>
  );
}
