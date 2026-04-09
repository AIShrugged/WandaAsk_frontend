import { redirect } from 'next/navigation';

import { ROUTES } from '@/shared/lib/routes';

/**
 * Legacy route — redirect to the new Debug → Logs tab.
 */
export default function DebugLogsRedirect() {
  redirect(ROUTES.DASHBOARD.DEBUG_LOGS);
}
