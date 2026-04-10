import { endOfMonth, format, startOfMonth } from 'date-fns';

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
  const currentMonth =
    params.month ?? format(startOfMonth(new Date()), 'yyyy-MM-dd');

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

  return <OrgCalendarView events={allMeetings} currentMonth={currentMonth} />;
}
