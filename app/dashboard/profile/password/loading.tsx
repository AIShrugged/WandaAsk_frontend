import { SkeletonList } from '@/shared/ui/layout/skeleton';

/**
 * Loading state for the Password tab.
 */
export default function Loading() {
  return (
    <div aria-busy='true' aria-label='Loading password form'>
      <SkeletonList rows={3} />
    </div>
  );
}
