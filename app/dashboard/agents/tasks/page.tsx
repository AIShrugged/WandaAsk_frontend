import { Bot } from 'lucide-react';
import Link from 'next/link';

import { getAgentTasks } from '@/features/agents/api/agents';
import { getAgentAccessContext } from '@/features/agents/lib/access';
import { AccessDeniedState } from '@/features/agents/ui/access-denied-state';
import { AgentTasksList } from '@/features/agents/ui/agent-tasks-list';
import { ServerError } from '@/shared/lib/errors';
import { ROUTES } from '@/shared/lib/routes';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import { EmptyState } from '@/shared/ui/feedback/empty-state';
import PageHeader from '@/widgets/layout/ui/page-header';

/**
 *
 */
export default async function AgentTasksPage() {
  const { canManageAgents, activeOrganization } = await getAgentAccessContext();

  if (!canManageAgents) {
    return (
      <Card className='h-full flex flex-col'>
        <PageHeader title='Agent Tasks' />
        <CardBody>
          <AccessDeniedState />
        </CardBody>
      </Card>
    );
  }

  let accessDenied = false;
  let tasks = [] as Awaited<ReturnType<typeof getAgentTasks>>['data'];
  let totalCount = 0;

  try {
    const response = await getAgentTasks();

    tasks = response.data;
    totalCount = response.totalCount;
  } catch (error) {
    if (error instanceof ServerError && error.status === 403) {
      accessDenied = true;
    } else {
      throw error;
    }
  }

  if (accessDenied) {
    return (
      <Card className='h-full flex flex-col'>
        <PageHeader title='Agent Tasks' />
        <CardBody>
          <AccessDeniedState description='The backend denied access to agent tasks for the current organization context.' />
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className='h-full flex flex-col'>
      <PageHeader title='Agent Tasks' />
      <div className='h-full overflow-y-auto'>
        <CardBody>
          <div className='mb-6 flex flex-wrap items-center justify-between gap-3'>
            <p className='text-sm text-muted-foreground'>
              Active organization context:{' '}
              {activeOrganization?.name ?? 'Unknown'} · {totalCount} tasks
            </p>
            <Link
              href={ROUTES.DASHBOARD.AGENT_TASKS_NEW}
              className='inline-flex h-10 items-center justify-center rounded-[var(--radius-button)] bg-primary px-4 text-sm text-primary-foreground'
            >
              New task
            </Link>
          </div>

          {tasks.length > 0 ? (
            <AgentTasksList tasks={tasks} />
          ) : (
            <EmptyState
              icon={Bot}
              title='No agent tasks yet'
              description='Create a task to connect a profile, schedule, and input payload.'
            />
          )}
        </CardBody>
      </div>
    </Card>
  );
}
