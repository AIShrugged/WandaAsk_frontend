import { Skeleton } from '@/shared/ui/layout/skeleton';

/**
 * Loading skeleton for the main dashboard page.
 * @returns JSX element.
 */
export default function Loading() {
  return (
    <div className='flex flex-col gap-5 h-full overflow-y-auto p-2'>
      {/* Greeting */}
      <div className='flex flex-col gap-2'>
        <Skeleton className='h-8 w-48 rounded-md' />
        <Skeleton className='h-4 w-32 rounded-md' />
      </div>

      {/* KPI row */}
      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6'>
        <Skeleton className='h-24 rounded-[var(--radius-card)]' />
        <Skeleton className='h-24 rounded-[var(--radius-card)]' />
        <Skeleton className='h-24 rounded-[var(--radius-card)]' />
        <Skeleton className='h-24 rounded-[var(--radius-card)]' />
        <Skeleton className='h-24 rounded-[var(--radius-card)]' />
        <Skeleton className='h-24 rounded-[var(--radius-card)]' />
      </div>

      {/* Today/tomorrow */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <Skeleton className='h-48 rounded-[var(--radius-card)]' />
        <Skeleton className='h-48 rounded-[var(--radius-card)]' />
      </div>

      {/* Last meeting + recommendations */}
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <Skeleton className='h-40 rounded-[var(--radius-card)]' />
        <Skeleton className='h-40 rounded-[var(--radius-card)]' />
      </div>

      {/* Charts */}
      <Skeleton className='h-64 rounded-[var(--radius-card)]' />

      {/* Agent tasks + participants */}
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <Skeleton className='h-72 rounded-[var(--radius-card)]' />
        <Skeleton className='h-72 rounded-[var(--radius-card)]' />
      </div>
    </div>
  );
}
