import { Skeleton } from '@/shared/ui/layout/skeleton';

export default function Loading() {
  return (
    <div className='w-full max-w-[400px]'>
      <div className='flex justify-center mb-8'>
        <Skeleton className='h-8 w-24' />
      </div>
      <div className='rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface-2)] px-8 py-10'>
        <Skeleton className='h-6 w-32 mb-2' />
        <Skeleton className='h-4 w-52 mb-8' />
        <div className='flex flex-col gap-4'>
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full mt-4' />
        </div>
      </div>
    </div>
  );
}
