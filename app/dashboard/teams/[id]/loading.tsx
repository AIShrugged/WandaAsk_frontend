import Card from '@/shared/ui/card/Card';
import { Skeleton, SkeletonList } from '@/shared/ui/layout/skeleton';

/**
 * Loading component.
 * @returns JSX element.
 */
export default function Loading() {
  return (
    <div aria-busy='true' aria-label='Loading content'>
      <Card className='h-full flex flex-col'>
        {/* KPI row skeleton */}
        <div className='grid grid-cols-3 gap-4 px-6 py-4 border-b border-border'>
          <Skeleton className='h-20 rounded-[var(--radius-card)]' />
          <Skeleton className='h-20 rounded-[var(--radius-card)]' />
          <Skeleton className='h-20 rounded-[var(--radius-card)]' />
        </div>
        {/* Tab strip skeleton */}
        <div className='flex gap-4 px-6 py-3 border-b border-border'>
          <Skeleton className='h-7 w-20' />
          <Skeleton className='h-7 w-24' />
          <Skeleton className='h-7 w-20' />
          <Skeleton className='h-7 w-20' />
          <Skeleton className='h-7 w-16' />
        </div>
        {/* Content skeleton */}
        <div className='px-6 py-4'>
          <SkeletonList rows={6} />
        </div>
      </Card>
    </div>
  );
}
