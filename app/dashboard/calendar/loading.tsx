import Card from '@/shared/ui/card/Card';
import SpinLoader from '@/shared/ui/layout/spin-loader';

/**
 * Loading component.
 */
export default function Loading() {
  return (
    <Card className='h-full flex flex-col items-center justify-center'>
      <div className='flex flex-col items-center gap-4 px-8 py-6'>
        <SpinLoader />
        <p className='text-muted-foreground'>Loading calendar...</p>
      </div>
    </Card>
  );
}
