import { CardGridSkeleton, DarkHeaderSkeleton } from '../../components/ui/Skeleton';

export default function AlumniLoading() {
  return (
    <>
      <DarkHeaderSkeleton titleWidth={220} />
      <CardGridSkeleton count={6} />
    </>
  );
}
