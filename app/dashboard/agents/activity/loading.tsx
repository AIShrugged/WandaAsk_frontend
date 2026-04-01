import { SkeletonList } from '@/shared/ui/layout/skeleton';

/**
 * Loading skeleton for the agent activity tab.
 */
export default function Loading() {
  return <SkeletonList rows={5} />;
}
