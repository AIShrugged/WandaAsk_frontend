import { MeetingDetail } from '@/features/meetings/ui/meeting-detail';
import Card from '@/shared/ui/card/Card';

/**
 * Meeting detail page.
 * @param params - Route params.
 */
export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Card className='h-full flex flex-col overflow-hidden'>
      <div className='flex-1 overflow-y-auto'>
        <div className='mx-auto w-full max-w-4xl px-6 py-6'>
          <MeetingDetail id={id} />
        </div>
      </div>
    </Card>
  );
}
