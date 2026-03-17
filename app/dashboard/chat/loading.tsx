import Card from '@/shared/ui/card/Card';
import { SkeletonList } from '@/shared/ui/layout/skeleton';

/**
 * Loading component.
 * @returns JSX element.
 */
export default function Loading() {
  return (
    <div aria-busy='true' aria-label='Loading content'>
      <Card className='h-full flex flex-col'>
        <SkeletonList rows={6} />
      </Card>
    </div>
  );
}
