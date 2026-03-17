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
      <Skeleton className='h-8 w-64 rounded-[var(--radius-card)]' />

      {/* Two-column stats */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
        <Skeleton className='h-20 rounded-[var(--radius-card)]' />
        <Skeleton className='h-20 rounded-[var(--radius-card)]' />
        <Skeleton className='h-20 rounded-[var(--radius-card)]' />
      </div>

      {/* Main content */}
      <Card className='p-5'>
        <Skeleton className='h-48 rounded-[var(--radius-card)]' />
      </Card>

      <Card className='p-5'>
        <Skeleton className='h-32 rounded-[var(--radius-card)]' />
      </Card>
    </div>
  );
}
