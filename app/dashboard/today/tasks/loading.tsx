import { PageContainer } from '@/shared/ui/layout/page-container';
import { Skeleton, SkeletonList } from '@/shared/ui/layout/skeleton';

export default function Loading() {
  return (
    <PageContainer>
      {/* Matches PageHeader height with border-b */}
      <div className='flex items-center gap-3 px-4 py-2 border-b border-border'>
        <Skeleton className='h-5 w-24' />
      </div>
      <SkeletonList rows={4} />
    </PageContainer>
  );
}
