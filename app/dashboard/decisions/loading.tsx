import { SkeletonList } from '@/shared/ui/layout/skeleton';

export default function DecisionsLoading() {
  return (
    <div className='px-4 py-4'>
      <SkeletonList rows={5} />
    </div>
  );
}
