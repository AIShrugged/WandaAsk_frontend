import { PageContainer } from '@/shared/ui/layout/page-container';
import SpinLoader from '@/shared/ui/layout/spin-loader';

export default function Loading() {
  return (
    <PageContainer className='items-center justify-center overflow-hidden'>
      <SpinLoader size='md' />
    </PageContainer>
  );
}
