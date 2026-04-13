import { SkeletonList } from '@/shared/ui/layout/skeleton';

/**
 * Loading state for the Account Info tab.
 */
export default function Loading() {
  return (
    <div aria-busy='true' aria-label='Loading account info'>
      <SkeletonList rows={1} />
    </div>
  );
}
