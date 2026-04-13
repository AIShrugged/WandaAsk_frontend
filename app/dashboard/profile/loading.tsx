import Card from '@/shared/ui/card/Card';
import { SkeletonList } from '@/shared/ui/layout/skeleton';

/**
 * Loading state for the profile section (shown during redirect to default tab).
 */
export default function Loading() {
  return (
    <Card className='h-full p-6' aria-busy='true' aria-label='Loading profile'>
      <SkeletonList rows={4} />
    </Card>
  );
}
