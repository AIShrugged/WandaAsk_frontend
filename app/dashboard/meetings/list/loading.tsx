import { Skeleton } from '@/shared/ui/layout/skeleton';

function ColumnSkeleton() {
  return (
    <div className='flex flex-1 flex-col gap-3'>
      <div className='flex flex-col gap-1 border-b border-border pb-3'>
        <Skeleton className='h-3 w-16' />
        <Skeleton className='h-4 w-20' />
      </div>
      <div className='flex flex-col gap-3'>
        {Array.from({ length: 3 }).map((_, i) => {
          return (
            <Skeleton
              key={i}
              className='h-28 w-full rounded-[var(--radius-card)]'
            />
          );
        })}
      </div>
    </div>
  );
}

/**
 * Loading state for Meetings list tab — 3-column skeleton.
 */
export default function Loading() {
  return (
    <div className='px-6 py-6'>
      <div className='hidden gap-6 md:grid md:grid-cols-3'>
        <ColumnSkeleton />
        <ColumnSkeleton />
        <ColumnSkeleton />
      </div>
      <div className='flex flex-col gap-8 md:hidden'>
        <ColumnSkeleton />
        <ColumnSkeleton />
        <ColumnSkeleton />
      </div>
    </div>
  );
}
