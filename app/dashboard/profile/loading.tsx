import { SkeletonList } from '@/shared/ui/layout/skeleton';

/**
 * Loading state for the profile section (shown during redirect to default tab).
 */
export default function Loading() {
  return <SkeletonList rows={4} />;
}
