import { Skeleton } from '@/shared/ui/layout/skeleton';

export default function Loading() {
  return (
    <div className='mx-auto w-full max-w-4xl px-6 py-6'>
      <div className='flex flex-col gap-3'>
        {Array.from({ length: 8 }).map((_, i) => {
          return (
            <Skeleton
              key={i}
              className='h-10 w-full rounded-[var(--radius-card)]'
            />
          );
        })}
      </div>
    </div>
  );
}
