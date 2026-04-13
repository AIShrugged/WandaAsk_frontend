'use client';

import { ROUTES } from '@/shared/lib/routes';
import { PageTabsNav } from '@/shared/ui/navigation/page-tabs-nav';

import type { PageTab } from '@/shared/ui/navigation/page-tabs-nav';

interface MeetingDetailTabsNavProps {
  meetingId: string;
  hasProtocol: boolean;
}

/**
 * MeetingDetailTabsNav — segmented tab strip for a single meeting's sub-pages.
 * Shows "Protocol" tab only when the meeting has a completed summary.
 */
export function MeetingDetailTabsNav({
  meetingId,
  hasProtocol,
}: MeetingDetailTabsNavProps) {
  const tabs: PageTab[] = [
    {
      href: ROUTES.DASHBOARD.MEETING_DETAIL_OVERVIEW(meetingId),
      label: 'Overview',
    },
    {
      href: ROUTES.DASHBOARD.MEETING_DETAIL_AGENDA(meetingId),
      label: hasProtocol ? 'Protocol' : 'Agenda',
    },
    {
      href: ROUTES.DASHBOARD.MEETING_DETAIL_TASKS(meetingId),
      label: 'Tasks',
    },
    {
      href: ROUTES.DASHBOARD.MEETING_DETAIL_TRANSCRIPT(meetingId),
      label: 'Transcript',
    },
  ];

  return <PageTabsNav tabs={tabs} variant='underline' />;
}
