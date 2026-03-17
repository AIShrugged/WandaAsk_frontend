import Card from '@/shared/ui/card/Card';
import SpinLoader from '@/shared/ui/layout/spin-loader';

/**
 * Loading component.
 * @returns JSX element.
 */
export default function Loading() {
  return (
    <div aria-busy='true' aria-label='Loading content'>
      <Card className='flex flex-col items-center justify-center p-12'>
        <SpinLoader />
      </Card>
    </div>
  );
}
