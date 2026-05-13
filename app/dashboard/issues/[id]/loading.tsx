import { Card } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/layout/skeleton';

export default function Loading() {
  return (
    <Card className='h-full flex flex-col'>
      <div className='px-4 py-3 border-b border-border flex items-center gap-3'>
        <Skeleton className='h-5 w-5' />
        <Skeleton className='h-6 w-48' />
        <Skeleton className='h-6 w-16 ml-auto' />
      </div>
      <div className='flex flex-1 gap-0'>
        <div className='flex-1 px-6 py-5 flex flex-col gap-4'>
          <Skeleton className='h-7 w-2/3' />
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-5/6' />
          <Skeleton className='h-4 w-3/4' />
          <div className='flex gap-4 pt-2'>
            <Skeleton className='h-8 w-28' />
            <Skeleton className='h-8 w-28' />
            <Skeleton className='h-8 w-28' />
          </div>
        </div>
        <div className='w-64 border-l border-border px-4 py-5 flex flex-col gap-3'>
          <Skeleton className='h-5 w-20' />
          <Skeleton className='h-8 w-full' />
          <Skeleton className='h-5 w-20 mt-2' />
          <Skeleton className='h-8 w-full' />
          <Skeleton className='h-5 w-20 mt-2' />
          <Skeleton className='h-8 w-full' />
        </div>
      </div>
    </Card>
  );
}
