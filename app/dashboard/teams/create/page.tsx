import { redirect } from 'next/navigation';

import { ROUTES } from '@/shared/lib/routes';

/**
 * Backward-compat redirect: /dashboard/teams/create → /dashboard/teams
 */
export default function Page() {
  redirect(ROUTES.DASHBOARD.TEAMS);
}
