import { CardGridSkeleton, DarkHeaderSkeleton } from '../../components/ui/Skeleton';

export default function TeamLoading() {
  return (
    <>
      <DarkHeaderSkeleton titleWidth={200} />
      <CardGridSkeleton count={6} />
    </>
  );
}
