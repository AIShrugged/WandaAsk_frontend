import { Skeleton } from '@/shared/ui/layout/skeleton';

/**
 * Loading skeleton for the kanban tab.
 */
export default function Loading() {
  return (
    <div className='grid grid-cols-2 gap-4 p-3 sm:grid-cols-4'>
      <Skeleton className='h-64 rounded-[var(--radius-card)]' />
      <Skeleton className='h-64 rounded-[var(--radius-card)]' />
      <Skeleton className='h-64 rounded-[var(--radius-card)]' />
      <Skeleton className='h-64 rounded-[var(--radius-card)]' />
    </div>
  );
}
