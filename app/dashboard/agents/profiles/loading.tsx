import { SkeletonList } from '@/shared/ui/layout/skeleton';

/**
 * Loading skeleton for the agent profiles tab.
 */
export default function Loading() {
  return <SkeletonList rows={5} />;
}
