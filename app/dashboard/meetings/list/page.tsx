import { getCalendarEvents } from '@/features/event/api/calendar-events';
import { MEETINGS_PAGE_SIZE } from '@/features/meetings/model/constants';
import { MeetingsList } from '@/features/meetings/ui/meetings-list';

/**
 * Meetings list tab.
 */
export default async function MeetingsListPage() {
  const { data: meetings = [], totalCount } = await getCalendarEvents(
    0,
    MEETINGS_PAGE_SIZE,
  );

  return (
    <div className='flex-1 overflow-y-auto'>
      <div className='mx-auto w-full max-w-4xl px-6 py-6'>
        <MeetingsList initialItems={meetings} totalCount={totalCount} />
      </div>
    </div>
  );
}
