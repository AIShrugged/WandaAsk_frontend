import { endOfMonth, format, startOfMonth } from 'date-fns';

import { getOrgCalendarEvents } from '@/features/meetings/api/org-calendar';
import { OrgCalendarView } from '@/features/meetings/ui/org-calendar-view';

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

  const { data: meetings = [] } = await getOrgCalendarEvents(
    0,
    200,
    dateFrom,
    dateTo,
  );

  return <OrgCalendarView events={meetings} currentMonth={currentMonth} />;
}
