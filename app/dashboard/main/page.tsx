import { redirect } from 'next/navigation';

import { ROUTES } from '@/shared/lib/routes';

/**
 * Redirects to the default main dashboard tab (overview).
 */
export default function MainDashboardPage() {
  redirect(ROUTES.DASHBOARD.MAIN_OVERVIEW);
}
