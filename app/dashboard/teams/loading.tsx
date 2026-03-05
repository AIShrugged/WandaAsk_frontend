import Card from '@/shared/ui/card/Card';
import { SkeletonList } from '@/shared/ui/layout/skeleton';

/**
 * Loading component.
 */
export default function Loading() {
  return (
    <Card className='h-full flex flex-col'>
      <SkeletonList rows={6} />
    </Card>
  );
}
