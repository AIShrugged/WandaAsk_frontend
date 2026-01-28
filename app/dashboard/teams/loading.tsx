import Card from '@/shared/ui/card/Card';
import SpinLoader from '@/shared/ui/layout/spin-loader';

export default function Loading() {
  return (
    <Card className='h-full flex flex-col items-center justify-center'>
      <div className='flex flex-col items-center gap-4 px-8 py-6'>
        <SpinLoader />
        <p className='text-secondary'>Loading teams...</p>
      </div>
    </Card>
  );
}
