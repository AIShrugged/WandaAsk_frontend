import Card from '@/shared/ui/card/Card';
import { SkeletonList } from '@/shared/ui/layout/skeleton';

/**
 * Loading component.
 * @returns JSX element.
 */
export default function Loading() {
  return (
    <div aria-busy='true' aria-label='Loading content'>
      <Card className='p-6'>
        <SkeletonList rows={4} />
      </Card>
    </div>
  );
}
