'use client';

import { ROUTES } from '@/shared/lib/routes';
import { PageTabsNav } from '@/shared/ui/navigation/page-tabs-nav';

const TABS = [
  { href: ROUTES.DASHBOARD.MEETINGS_LIST, label: 'Meetings' },
  { href: ROUTES.DASHBOARD.MEETINGS_CALENDAR, label: 'Calendar' },
] as const;

/**
 * MeetingsTabsNav — route-based tab strip for the meetings section.
 * Active tab is derived from the current pathname.
 */
export function MeetingsTabsNav() {
  return <PageTabsNav tabs={TABS} />;
}
