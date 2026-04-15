import { Skeleton } from '@/shared/ui/layout/skeleton';

export default function Loading() {
  return (
    <div className='mx-auto w-full max-w-4xl px-6 py-6'>
      <div className='flex flex-col gap-6'>
        <Skeleton className='h-36 w-full rounded-[var(--radius-card)]' />
        <Skeleton className='h-28 w-full rounded-[var(--radius-card)]' />
        <Skeleton className='h-48 w-full rounded-[var(--radius-card)]' />
      </div>
    </div>
  );
}
