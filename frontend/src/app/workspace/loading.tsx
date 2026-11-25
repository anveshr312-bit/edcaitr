import { CardGridSkeleton, DarkHeaderSkeleton } from '../../components/ui/Skeleton';

export default function WorkspaceLoading() {
  return (
    <>
      <DarkHeaderSkeleton titleWidth={240} />
      <CardGridSkeleton count={4} />
    </>
  );
}
