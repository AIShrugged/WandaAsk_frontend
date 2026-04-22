import { notFound } from 'next/navigation';

import {
  getAgentTask,
  getAgentAccessContext,
  formatDateTime,
  AccessDeniedState,
  AgentTaskActions,
} from '@/features/agents';
import { ServerError } from '@/shared/lib/errors';
import { ROUTES } from '@/shared/lib/routes';
import { Badge } from '@/shared/ui/badge';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import { PageTabsNav } from '@/shared/ui/navigation/page-tabs-nav';
import PageHeader from '@/widgets/layout/ui/page-header';

/**
 * Agent task detail layout.
 * Renders the shared header, metadata badges, actions, and route-based tab strip.
 */
export default async function AgentTaskDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profileId = Number(id);

  if (!Number.isFinite(profileId) || profileId <= 0) notFound();

  const { canManageAgents } = await getAgentAccessContext();

  if (!canManageAgents) {
    return (
      <Card className='h-full flex flex-col'>
        <PageHeader hasButtonBack title='Agent Task' />
        <CardBody>
          <AccessDeniedState />
        </CardBody>
      </Card>
    );
  }

  let accessDenied = false;
  let task = null as Awaited<ReturnType<typeof getAgentTask>> | null;

  try {
    task = await getAgentTask(profileId);
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
        <PageHeader hasButtonBack title='Agent Task' />
        <CardBody>
          <AccessDeniedState description='The backend denied access to this task or its runs.' />
        </CardBody>
      </Card>
    );
  }

  if (!task) notFound();

  const base = `${ROUTES.DASHBOARD.AGENT_TASKS}/${task.id}`;

  const TABS = [
    { href: `${base}/overview`, label: 'Overview' },
    { href: `${base}/runs`, label: 'Runs' },
    { href: `${base}/config`, label: 'Configuration' },
    { href: `${base}/json`, label: 'Raw JSON' },
  ] as const;

  return (
    <Card className='h-full flex flex-col'>
      <PageHeader hasButtonBack title={task.name} />
      <div className='h-full overflow-y-auto'>
        <CardBody>
          <div className='mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
            <div className='flex flex-col gap-2 min-w-0'>
              <div className='flex flex-wrap items-center gap-2'>
                <Badge variant={task.enabled ? 'success' : 'warning'}>
                  {task.enabled ? 'Enabled' : 'Disabled'}
                </Badge>
                <Badge>{task.execution_mode || 'No execution mode'}</Badge>
                <Badge>{task.schedule_type || 'No schedule type'}</Badge>
              </div>
              <p className='text-sm text-muted-foreground'>
                Created {formatDateTime(task.created_at)} · Updated{' '}
                {formatDateTime(task.updated_at)}
              </p>
            </div>
            <div className='shrink-0'>
              <AgentTaskActions
                id={task.id}
                enabled={task.enabled}
                backHref={ROUTES.DASHBOARD.AGENT_TASKS}
              />
            </div>
          </div>

          <div className='mb-6'>
            <PageTabsNav tabs={TABS} variant='segmented' />
          </div>

          {children}
        </CardBody>
      </div>
    </Card>
  );
}
