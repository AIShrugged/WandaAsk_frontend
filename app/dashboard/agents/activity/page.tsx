import { getAgentActivity } from '@/features/agents/api/activity';
import { getAgentAccessContext } from '@/features/agents/lib/access';
import { AccessDeniedState } from '@/features/agents/ui/access-denied-state';
import { AgentActivityFeed } from '@/features/agents/ui/agent-activity-feed';
import { ServerError } from '@/shared/lib/errors';

export const metadata = { title: 'Agent Activity' };

/**
 * Agent Activity tab page.
 */
export default async function AgentActivityPage() {
  const { canManageAgents } = await getAgentAccessContext();

  if (!canManageAgents) {
    return (
      <AccessDeniedState description='The backend denied access to agent activity for the current organization context.' />
    );
  }

  let accessDenied = false;
  let activityItems: Awaited<ReturnType<typeof getAgentActivity>>['items'] = [];
  let activityTotal = 0;

  await getAgentActivity()
    .then((r) => {
      activityItems = r.items;
      activityTotal = r.totalCount;
    })
    .catch((error) => {
      if (error instanceof ServerError && error.status === 403) {
        accessDenied = true;
      } else {
        throw error;
      }
    });

  if (accessDenied) {
    return (
      <AccessDeniedState description='The backend denied access to agent activity for the current organization context.' />
    );
  }

  return (
    <AgentActivityFeed
      initialItems={activityItems}
      totalCount={activityTotal}
    />
  );
}
