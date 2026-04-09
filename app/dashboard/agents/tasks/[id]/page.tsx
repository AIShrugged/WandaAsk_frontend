import { redirect } from 'next/navigation';

import { ROUTES } from '@/shared/lib/routes';

/**
 * Redirects to the default (overview) tab.
 */
export default async function AgentTaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  redirect(`${ROUTES.DASHBOARD.AGENT_TASKS}/${id}/overview`);
}
