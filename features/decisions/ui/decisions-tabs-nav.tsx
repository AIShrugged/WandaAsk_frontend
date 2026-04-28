'use client';

import { ROUTES } from '@/shared/lib/routes';
import { PageTabsNav } from '@/shared/ui/navigation/page-tabs-nav';

const TABS = [
  { href: ROUTES.DASHBOARD.DECISIONS_ALL, label: 'All' },
  { href: ROUTES.DASHBOARD.DECISIONS_MEETINGS, label: 'From meetings' },
  { href: ROUTES.DASHBOARD.DECISIONS_MANUAL, label: 'Manual' },
] as const;

export function DecisionsTabsNav() {
  return <PageTabsNav tabs={TABS} />;
}
