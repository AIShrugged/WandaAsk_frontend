import Card from '@/shared/ui/card/Card';
import { Skeleton } from '@/shared/ui/layout/skeleton';

/**
 * Loading component.
 * @returns JSX element.
 */
export default function Loading() {
  return (
    <div
      aria-busy='true'
      aria-label='Loading content'
      className='flex flex-col gap-4 p-2'
    >
      {/* Header */}
      <Skeleton className='h-8 w-56 rounded-[var(--radius-card)]' />

      {/* Analysis charts */}
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <Card className='p-5'>
          <Skeleton className='h-52 rounded-[var(--radius-card)]' />
        </Card>
        <Card className='p-5'>
          <Skeleton className='h-52 rounded-[var(--radius-card)]' />
        </Card>
      </div>

      {/* Details */}
      <Card className='p-5'>
        <Skeleton className='h-36 rounded-[var(--radius-card)]' />
      </Card>
    </div>
  );
}
