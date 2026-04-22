import { Bot } from 'lucide-react';
import Link from 'next/link';

import {
  getAgentTasks,
  getAgentAccessContext,
  AccessDeniedState,
  AgentTasksList,
} from '@/features/agents';
import { ServerError } from '@/shared/lib/errors';
import { ROUTES } from '@/shared/lib/routes';
import Card from '@/shared/ui/card/Card';
import { EmptyState } from '@/shared/ui/feedback/empty-state';

export const metadata = { title: 'Agent Tasks' };

/**
 * Agent Tasks tab page.
 */
export default async function AgentTasksPage() {
  const { canManageAgents, activeOrganization } = await getAgentAccessContext();

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
      <div className='mb-6 flex flex-wrap items-center justify-between gap-3'>
        <p className='text-sm text-muted-foreground'>
          Active organization context: {activeOrganization?.name ?? 'Unknown'} ·{' '}
          {tasksTotal > 0 ? tasksTotal : tasks.length} tasks
        </p>
        <Link
          href={ROUTES.DASHBOARD.AGENT_TASKS_NEW}
          className='inline-flex h-10 items-center justify-center rounded-[var(--radius-button)] bg-primary px-4 text-sm text-primary-foreground'
        >
          New task
        </Link>
      </div>
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
