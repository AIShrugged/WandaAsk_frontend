import { redirect } from 'next/navigation';

import { ROUTES } from '@/shared/lib/routes';

/**
 * /dashboard/debug → redirect to the Logs tab.
 */
export default function DebugPage() {
  redirect(ROUTES.DASHBOARD.DEBUG_LOGS);
}
