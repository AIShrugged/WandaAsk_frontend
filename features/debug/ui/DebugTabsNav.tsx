'use client';

import { ROUTES } from '@/shared/lib/routes';
import { PageTabsNav } from '@/shared/ui/navigation/page-tabs-nav';

const TABS = [
  { href: ROUTES.DASHBOARD.DEBUG_LOGS, label: 'Logs' },
  { href: ROUTES.DASHBOARD.DEBUG_API, label: 'API' },
] as const;

/**
 * DebugTabsNav — route-based tab strip for the debug section.
 * Active tab is derived from the current pathname.
 */
export function DebugTabsNav() {
  return <PageTabsNav tabs={TABS} preserveSearchParams />;
}
