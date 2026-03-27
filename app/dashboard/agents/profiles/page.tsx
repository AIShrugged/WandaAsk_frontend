import { redirect } from 'next/navigation';

import { ROUTES } from '@/shared/lib/routes';

/**
 *
 */
export default function AgentProfilesPage() {
  redirect(ROUTES.DASHBOARD.AGENTS);
}
