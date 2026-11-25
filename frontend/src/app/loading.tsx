import { CardGridSkeleton, DarkHeaderSkeleton } from '../components/ui/Skeleton';

export default function RootLoading() {
  return (
    <>
      <DarkHeaderSkeleton titleWidth={320} />
      <CardGridSkeleton count={3} />
    </>
  );
}
