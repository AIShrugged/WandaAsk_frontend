'use client';

import { ROUTES } from '@/shared/lib/routes';
import { PageTabsNav } from '@/shared/ui/navigation/page-tabs-nav';

const TABS = [
  {
    href: ROUTES.DASHBOARD.MAIN_OVERVIEW,
    label: 'Main',
    match: 'exact' as const,
  },
  {
    href: ROUTES.DASHBOARD.MAIN_STATISTICS,
    label: 'Statistics',
    match: 'exact' as const,
  },
] as const;

/**
 * DashboardTabsNav — route-based tab strip for the main dashboard section.
 * Active tab is derived from the current pathname.
 */
export function DashboardTabsNav() {
  return <PageTabsNav tabs={TABS} />;
}
