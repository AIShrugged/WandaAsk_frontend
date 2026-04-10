import { endOfMonth, format, startOfMonth } from 'date-fns';
import { redirect } from 'next/navigation';

import { getOrgCalendarEvents } from '@/features/meetings/api/org-calendar';
import { OrgCalendarView } from '@/features/meetings/ui/org-calendar-view';

import type { CalendarEventListItem } from '@/features/meetings/model/types';

const PAGE_SIZE = 100;

interface PageProps {
  searchParams: Promise<{ month?: string }>;
}

/**
 * Organization Calendar tab — shows all org meetings where the bot was added,
 * rendered as a monthly calendar grid.
 */
export default async function OrganizationCalendarPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  if (!params.month) {
    const currentMonth = format(startOfMonth(new Date()), 'yyyy-MM-01');
    redirect(`/dashboard/meetings/organization?month=${currentMonth}`);
  }

  const currentMonth = params.month;

  const monthStart = startOfMonth(currentMonth);
  const dateFrom = format(monthStart, 'yyyy-MM-dd');
  const dateTo = format(endOfMonth(monthStart), 'yyyy-MM-dd');

  const allMeetings: CalendarEventListItem[] = [];
  let offset = 0;

  while (true) {
    const { data = [], totalCount } = await getOrgCalendarEvents(
      offset,
      PAGE_SIZE,
      dateFrom,
      dateTo,
    );

    allMeetings.push(...data);
    offset += data.length;

    if (offset >= totalCount || data.length === 0) break;
  }

  return (
    <div className='h-full flex flex-col overflow-hidden'>
      <OrgCalendarView events={allMeetings} currentMonth={currentMonth} />
    </div>
  );
}
