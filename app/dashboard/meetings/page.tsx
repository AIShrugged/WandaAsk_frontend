import { getCalendarEvents } from '@/features/event/api/calendar-events';
import { MEETINGS_PAGE_SIZE } from '@/features/meetings/model/constants';
import { MeetingsList } from '@/features/meetings/ui/meetings-list';
import Card from '@/shared/ui/card/Card';
import PageHeader from '@/widgets/layout/ui/page-header';

/**
 * Meetings page.
 */
export default async function MeetingsPage() {
  const { data: meetings = [], totalCount } = await getCalendarEvents(
    0,
    MEETINGS_PAGE_SIZE,
  );

  return (
    <Card className='h-full flex flex-col overflow-hidden'>
      <PageHeader title='Meetings' />

      <div className='flex-1 overflow-y-auto'>
        <div className='mx-auto w-full max-w-4xl px-6 py-6'>
          <MeetingsList initialItems={meetings} totalCount={totalCount} />
        </div>
      </div>
    </Card>
  );
}
