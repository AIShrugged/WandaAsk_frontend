import Card from '@/shared/ui/card/Card';
import { Skeleton } from '@/shared/ui/layout/skeleton';

/**
 * Loading component.
 * @returns JSX element.
 */
export default function Loading() {
  return (
    <div className='flex flex-col gap-6 h-full overflow-y-auto p-2'>
      {/* Header skeleton */}
      <div className='flex items-center gap-3'>
        <Skeleton className='h-10 w-10 rounded-xl' />
        <div className='flex flex-col gap-2'>
          <Skeleton className='h-7 w-48' />
          <Skeleton className='h-4 w-72' />
        </div>
      </div>

      {/* KPI row skeleton */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5'>
        {Array.from({ length: 5 }).map((_, i) => {
          return (
            <Card key={i} className='p-5 flex flex-col gap-3'>
              <div className='flex items-center justify-between'>
                <Skeleton className='h-4 w-28' />
                <Skeleton className='h-8 w-8 rounded-md' />
              </div>
              <Skeleton className='h-9 w-16' />
            </Card>
          );
        })}
      </div>

      {/* Meetings section skeleton */}
      <div className='flex flex-col gap-4'>
        <Skeleton className='h-6 w-24' />
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
          {Array.from({ length: 3 }).map((_, i) => {
            return <Skeleton key={i} className='h-16 rounded-lg' />;
          })}
        </div>
        <Card className='p-5'>
          <Skeleton className='mb-4 h-4 w-40' />
          <Skeleton className='h-[200px] w-full rounded-md' />
        </Card>
        <Card className='p-5'>
          <Skeleton className='mb-4 h-4 w-36' />
          <div className='flex flex-col gap-3'>
            {Array.from({ length: 5 }).map((_, i) => {
              return <Skeleton key={i} className='h-9 w-full' />;
            })}
          </div>
        </Card>
      </div>

      {/* Tasks & Follow-ups skeleton */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        {Array.from({ length: 2 }).map((_, i) => {
          return (
            <div key={i} className='flex flex-col gap-4'>
              <div className='flex items-center justify-between'>
                <Skeleton className='h-6 w-24' />
                <Skeleton className='h-9 w-10' />
              </div>
              <Card className='p-5'>
                <Skeleton className='h-[220px] w-full rounded-md' />
              </Card>
            </div>
          );
        })}
      </div>

      {/* Participants skeleton */}
      <div className='flex flex-col gap-4'>
        <Skeleton className='h-6 w-28' />
        <div className='grid grid-cols-2 gap-3'>
          <Skeleton className='h-16 rounded-lg' />
          <Skeleton className='h-16 rounded-lg' />
        </div>
        <Card className='p-5'>
          <Skeleton className='mb-4 h-4 w-32' />
          <Skeleton className='h-[300px] w-full rounded-md' />
        </Card>
      </div>

      {/* Teams skeleton */}
      <div className='flex flex-col gap-4'>
        <Skeleton className='h-6 w-24' />
        <Skeleton className='h-16 rounded-lg' />
        <Card className='p-5'>
          <Skeleton className='mb-4 h-4 w-32' />
          <Skeleton className='h-[200px] w-full rounded-md' />
        </Card>
      </div>
    </div>
  );
}
