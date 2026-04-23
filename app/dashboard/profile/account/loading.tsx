import { SkeletonList } from '@/shared/ui/layout/skeleton';

/**
 * Loading state for the Info tab.
 */
export default function Loading() {
  return (
    <div aria-busy='true' aria-label='Loading info'>
      <SkeletonList rows={1} />
    </div>
  );
}
