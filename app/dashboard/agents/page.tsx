import { redirect } from 'next/navigation';

import { ROUTES } from '@/shared/lib/routes';

/**
 * Redirects to the default agents tab (tasks).
 */
export default function AgentsPage() {
  redirect(ROUTES.DASHBOARD.AGENT_TASKS);
}
