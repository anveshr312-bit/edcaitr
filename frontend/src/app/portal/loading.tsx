import { CardGridSkeleton, DarkHeaderSkeleton } from '../../components/ui/Skeleton';

export default function PortalLoading() {
  return (
    <>
      <DarkHeaderSkeleton titleWidth={220} />
      <CardGridSkeleton count={4} />
    </>
  );
}
