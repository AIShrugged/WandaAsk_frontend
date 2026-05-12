import { Card, CardBody } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/layout/skeleton';

export default function Loading() {
  return (
    <Card className='h-full flex flex-col'>
      <div className='p-4 border-b border-border'>
        <Skeleton className='h-6 w-32' />
      </div>
      <CardBody>
        <div className='flex flex-col gap-4'>
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-24 w-full' />
          <div className='grid gap-2 md:grid-cols-2'>
            <Skeleton className='h-10' />
            <Skeleton className='h-10' />
          </div>
          <div className='grid gap-2 md:grid-cols-2'>
            <Skeleton className='h-10' />
            <Skeleton className='h-10' />
          </div>
          <Skeleton className='h-10 w-full' />
          <div className='grid gap-2 md:grid-cols-2'>
            <Skeleton className='h-10' />
            <Skeleton className='h-10' />
          </div>
          <div className='grid gap-2 md:grid-cols-2'>
            <Skeleton className='h-10' />
            <Skeleton className='h-10' />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
