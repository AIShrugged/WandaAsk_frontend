import { Skeleton } from '@/shared/ui/layout/skeleton';

/**
 * Loading skeleton for the statistics tab.
 */
export default function Loading() {
  return (
    <div className='flex flex-col gap-6 p-2'>
      <Skeleton className='h-8 w-40 rounded-md' />
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5'>
        <Skeleton className='h-24 rounded-[var(--radius-card)]' />
        <Skeleton className='h-24 rounded-[var(--radius-card)]' />
        <Skeleton className='h-24 rounded-[var(--radius-card)]' />
        <Skeleton className='h-24 rounded-[var(--radius-card)]' />
        <Skeleton className='h-24 rounded-[var(--radius-card)]' />
      </div>
      <Skeleton className='h-64 rounded-[var(--radius-card)]' />
    </div>
  );
}
