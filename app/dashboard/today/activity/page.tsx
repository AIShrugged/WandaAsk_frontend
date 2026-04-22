import { MousePointerClick } from 'lucide-react';

import {
  getAgentTask,
  getAgentAccessContext,
  AccessDeniedState,
  TodayActivityFeed,
} from '@/features/agents';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import { EmptyState } from '@/shared/ui/feedback/empty-state';
import PageHeader from '@/widgets/layout/ui/page-header';

import type { AgentTaskLatestRun } from '@/features/agents';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Activity' };

/**
 *
 * @param root0
 * @param root0.searchParams
 */
export default async function TodayActivityPage({
  searchParams,
}: {
  searchParams?: Promise<{ taskId?: string }>;
}) {
  const { taskId } = (await searchParams) ?? {};

  if (!taskId) {
    return (
      <Card className='h-full flex flex-col'>
        <PageHeader title='Activity' />
        <CardBody>
          <EmptyState
            icon={MousePointerClick}
            title='No task selected'
            description='Select an agent task to view its activity here.'
          />
        </CardBody>
      </Card>
    );
  }

  const { canManageAgents } = await getAgentAccessContext();

  if (!canManageAgents) {
    return (
      <Card className='h-full flex flex-col'>
        <PageHeader title='Activity' />
        <CardBody>
          <AccessDeniedState />
        </CardBody>
      </Card>
    );
  }

  const task = await getAgentTask(Number(taskId));

  const latestRun = task.latest_run as AgentTaskLatestRun | null | undefined;

  if (!latestRun) {
    return (
      <Card className='h-full flex flex-col'>
        <PageHeader title='Activity' />
        <CardBody>
          <EmptyState
            icon={MousePointerClick}
            title='No runs yet'
            description='This task has not run yet. Dispatch it to see activity here.'
          />
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className='h-full flex flex-col'>
      <PageHeader title='Activity' />
      <CardBody>
        <TodayActivityFeed run={latestRun} items={latestRun.activity ?? []} />
      </CardBody>
    </Card>
  );
}
