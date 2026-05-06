import SpinLoader from '@/shared/ui/layout/spin-loader';

export default function Loading() {
  return (
    <div className='flex h-full rounded-[var(--radius-card)] overflow-hidden border border-border bg-card items-center justify-center'>
      <SpinLoader size='md' />
    </div>
  );
}
