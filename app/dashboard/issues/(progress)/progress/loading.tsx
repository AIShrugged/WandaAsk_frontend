import { Skeleton } from '@/shared/ui/layout/skeleton';

export default function IssuesProgressLoading() {
  return (
    <div className='space-y-6 p-6'>
      <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, i) => {
          return (
            <div
              key={i}
              className='rounded-[var(--radius-card)] border border-border bg-card p-5'
            >
              <Skeleton className='mb-3 h-4 w-28' />
              <Skeleton className='h-8 w-16' />
              <Skeleton className='mt-3 h-4 w-24' />
            </div>
          );
        })}
      </div>
      <div className='rounded-[var(--radius-card)] border border-border bg-card p-5'>
        <Skeleton className='mb-4 h-4 w-48' />
        <Skeleton className='h-60 w-full' />
      </div>
    </div>
  );
}
