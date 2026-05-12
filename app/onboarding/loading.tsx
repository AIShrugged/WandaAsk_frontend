import { Skeleton } from '@/shared/ui/layout/skeleton';

export default function Loading() {
  return (
    <div className='space-y-4'>
      <Skeleton className='h-8 w-64' />
      <Skeleton className='h-4 w-96' />
      <Skeleton className='h-40 w-full' />
      <Skeleton className='h-10 w-32' />
    </div>
  );
}
