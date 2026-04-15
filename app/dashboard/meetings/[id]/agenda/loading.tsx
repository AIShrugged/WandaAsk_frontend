import { Skeleton } from '@/shared/ui/layout/skeleton';

export default function Loading() {
  return (
    <div className='mx-auto w-full max-w-4xl px-6 py-6'>
      <Skeleton className='h-64 w-full rounded-[var(--radius-card)]' />
    </div>
  );
}
