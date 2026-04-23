'use client';

import { ROUTES } from '@/shared/lib/routes';
import { PageTabsNav } from '@/shared/ui/navigation/page-tabs-nav';

const TABS = [
  { href: ROUTES.DASHBOARD.PROFILE_ACCOUNT, label: 'Info' },
  { href: ROUTES.DASHBOARD.PROFILE_PASSWORD, label: 'Password' },
  { href: ROUTES.DASHBOARD.PROFILE_CALENDAR, label: 'Calendar' },
  { href: ROUTES.DASHBOARD.PROFILE_MENU, label: 'Menu' },
  { href: ROUTES.DASHBOARD.PROFILE_APPEARANCE, label: 'Appearance' },
] as const;

/**
 * ProfileTabsNav — route-based tab strip for the profile section.
 */
export function ProfileTabsNav() {
  return <PageTabsNav tabs={TABS} />;
}
