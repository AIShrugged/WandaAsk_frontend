import { SkeletonList } from '@/shared/ui/layout/skeleton';

export default function Loading() {
  return (
    <div aria-busy='true' aria-label='Loading connections'>
      <SkeletonList rows={2} />
    </div>
  );
}
