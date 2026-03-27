import { redirect } from 'next/navigation';

import { ROUTES } from '@/shared/lib/routes';

/**
 *
 */
export default function AgentTasksPage() {
  redirect(ROUTES.DASHBOARD.AGENTS);
}
