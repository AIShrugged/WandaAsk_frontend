import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
}

/**
 * Skeleton component.
 * @param props - Component props.
 * @param props.className
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={clsx('animate-pulse rounded-md bg-muted', className)} />
  );
}

/**
 * SkeletonList component.
 * @param props - Component props.
 * @param props.rows
 */
export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div className='flex flex-col gap-3 p-4'>
      {Array.from({ length: rows }).map((_, i) => {
        return (
          <div key={i} className='flex items-center gap-3'>
            <Skeleton className='h-10 w-10 rounded-full flex-shrink-0' />
            <div className='flex-1 flex flex-col gap-2'>
              <Skeleton className='h-4 w-3/4' />
              <Skeleton className='h-3 w-1/2' />
            </div>
          </div>
        );
      })}
    </div>
  );
}
