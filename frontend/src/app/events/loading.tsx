import { CardGridSkeleton, DarkHeaderSkeleton } from '../../components/ui/Skeleton';

export default function EventsLoading() {
  return (
    <>
      <DarkHeaderSkeleton titleWidth={180} />
      <CardGridSkeleton count={6} hasPoster />
    </>
  );
}
