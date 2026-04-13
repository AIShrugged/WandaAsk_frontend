import { SkeletonList } from '@/shared/ui/layout/skeleton';

/**
 * Loading state for the Calendar tab.
 */
export default function Loading() {
  return (
    <div aria-busy='true' aria-label='Loading calendar'>
      <SkeletonList rows={1} />
    </div>
  );
}
