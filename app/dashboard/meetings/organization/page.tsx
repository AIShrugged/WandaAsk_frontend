import { getOrgCalendarEvents } from '@/features/meetings/api/org-calendar';
import { MEETINGS_PAGE_SIZE } from '@/features/meetings/model/constants';
import { getDefaultDateRange } from '@/features/meetings/model/utils';
import { OrgMeetingsList } from '@/features/meetings/ui/org-meetings-list';

interface PageProps {
  searchParams: Promise<{ date_from?: string; date_to?: string }>;
}

/**
 * Organization Calendar tab — shows all org meetings where the bot was added.
 */
export default async function OrganizationCalendarPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const defaultRange = getDefaultDateRange();

  const dateFrom = params.date_from ?? defaultRange.from;
  const dateTo = params.date_to ?? defaultRange.to;

  const { data: meetings = [], totalCount } = await getOrgCalendarEvents(
    0,
    MEETINGS_PAGE_SIZE,
    dateFrom,
    dateTo,
  );

  return (
    <OrgMeetingsList
      initialItems={meetings}
      totalCount={totalCount}
      defaultDateFrom={dateFrom}
      defaultDateTo={dateTo}
    />
  );
}
