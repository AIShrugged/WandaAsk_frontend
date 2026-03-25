import { getAgentActivity } from '@/features/agents/api/activity';
import { getAgentAccessContext } from '@/features/agents/lib/access';
import { AccessDeniedState } from '@/features/agents/ui/access-denied-state';
import { AgentActivityFeed } from '@/features/agents/ui/agent-activity-feed';
import { ServerError } from '@/shared/lib/errors';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import PageHeader from '@/widgets/layout/ui/page-header';

/**
 *
 */
export default async function AgentActivityPage() {
  const { canManageAgents } = await getAgentAccessContext();

  if (!canManageAgents) {
    return (
      <Card className='flex h-full flex-col'>
        <PageHeader title='Agent Activity' />
        <CardBody>
          <AccessDeniedState />
        </CardBody>
      </Card>
    );
  }

  let accessDenied = false;
  let totalCount = 0;
  let initialItems = [] as Awaited<
    ReturnType<typeof getAgentActivity>
  >['items'];

  try {
    const response = await getAgentActivity();

    initialItems = response.items;
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
      <Card className='flex h-full flex-col'>
        <PageHeader title='Agent Activity' />
        <CardBody>
          <AccessDeniedState description='The backend denied access to agent activity for the current organization context.' />
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className='flex h-full flex-col'>
      <PageHeader title='Agent Activity' />
      <div className='h-full overflow-y-auto'>
        <CardBody>
          <div className='mb-6 flex flex-wrap items-center justify-between gap-3'>
            <p className='text-sm text-muted-foreground'>
              Activity feed for all agents. Showing {totalCount} entries.
            </p>
          </div>

          <AgentActivityFeed
            initialItems={initialItems}
            totalCount={totalCount}
          />
        </CardBody>
      </div>
    </Card>
  );
}
