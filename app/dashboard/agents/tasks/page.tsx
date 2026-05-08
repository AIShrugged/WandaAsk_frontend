import { Bot } from 'lucide-react';

import {
  getAgentTasks,
  getAgentAccessContext,
  AccessDeniedState,
  AgentTasksList,
} from '@/features/agents';
import { ServerError } from '@/shared/lib/errors';
import { Card } from '@/shared/ui/card';
import { EmptyState } from '@/shared/ui/feedback/empty-state';

export const metadata = { title: 'Agent Tasks' };

/**
 * Agent Tasks tab page.
 */
export default async function AgentTasksPage() {
  const { canManageAgents } = await getAgentAccessContext();

  if (!canManageAgents) {
    return (
      <AccessDeniedState description='The backend denied access to agent tasks for the current organization context.' />
    );
  }

  let accessDenied = false;
  let tasks: Awaited<ReturnType<typeof getAgentTasks>>['data'] = [];
  let tasksTotal = 0;

  await getAgentTasks()
    .then((r) => {
      tasks = r.data;
      tasksTotal = r.totalCount;
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
      <AccessDeniedState description='The backend denied access to agent tasks for the current organization context.' />
    );
  }

  return (
    <Card>
      {tasks.length > 0 ? (
        <AgentTasksList initialTasks={tasks} totalCount={tasksTotal} />
      ) : (
        <EmptyState
          icon={Bot}
          title='No agent tasks yet'
          description='Create a task to connect a profile, schedule, and input payload.'
        />
      )}
    </Card>
  );
}
