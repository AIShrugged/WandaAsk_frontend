import SpinLoader from '@/shared/ui/layout/spin-loader';

/**
 * Loading state for Meetings page (shown while layout sub-route loads).
 */
export default function Loading() {
  return (
    <div className='flex flex-1 items-center justify-center py-12'>
      <SpinLoader />
    </div>
  );
}
