import { getCalendarEvents } from '@/features/event/api/calendar-events';
import { MeetingsList } from '@/features/meetings/ui/meetings-list';
import Card from '@/shared/ui/card/Card';
import PageHeader from '@/widgets/layout/ui/page-header';

/**
 * Meetings page.
 */
export default async function MeetingsPage() {
  const { data: meetings = [] } = await getCalendarEvents();

  return (
    <Card className='h-full flex flex-col overflow-hidden'>
      <PageHeader title='Meetings' />

      <div className='flex-1 overflow-y-auto'>
        <div className='mx-auto w-full max-w-4xl px-6 py-6'>
          <MeetingsList items={meetings} />
        </div>
      </div>
    </Card>
  );
}
