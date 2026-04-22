import { Skeleton } from '@/shared/ui/layout/skeleton';

export default function Loading() {
  return (
    <div aria-busy='true' aria-label='Loading appearance settings'>
      <Skeleton className='h-48 w-full' />
    </div>
  );
}
