import { SkeletonList } from '@/shared/ui/layout/skeleton';

export default function Loading() {
  return (
    <div aria-busy='true' aria-label='Loading menu settings'>
      <SkeletonList rows={3} />
    </div>
  );
}
