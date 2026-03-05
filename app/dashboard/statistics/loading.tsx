import Card from '@/shared/ui/card/Card';
import { Skeleton } from '@/shared/ui/layout/skeleton';

/**
 * Loading component.
 */
export default function Loading() {
  return (
    <Card className='h-full flex flex-col gap-4 p-6'>
      <Skeleton className='h-6 w-40' />
      <div className='grid grid-cols-3 gap-4'>
        <Skeleton className='h-24 rounded-xl' />
        <Skeleton className='h-24 rounded-xl' />
        <Skeleton className='h-24 rounded-xl' />
      </div>
      <Skeleton className='h-48 rounded-xl' />
    </Card>
  );
}
