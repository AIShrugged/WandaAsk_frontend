import { Bot } from 'lucide-react';
import Link from 'next/link';

import { getAgentActivity } from '@/features/agents/api/activity';
import {
  getAgentProfiles,
  getAgentTasks,
  getAgentTasksMeta,
  getAgentTools,
} from '@/features/agents/api/agents';
import { getAgentAccessContext } from '@/features/agents/lib/access';
import {
  normalizeMetaOptions,
  normalizeToolOptions,
} from '@/features/agents/lib/format';
import { AccessDeniedState } from '@/features/agents/ui/access-denied-state';
import { AgentActivityFeed } from '@/features/agents/ui/agent-activity-feed';
import { AgentProfilesList } from '@/features/agents/ui/agent-profiles-list';
import { AgentTasksList } from '@/features/agents/ui/agent-tasks-list';
import { AgentsTabs } from '@/features/agents/ui/agents-tabs';
import { ServerError } from '@/shared/lib/errors';
import { ROUTES } from '@/shared/lib/routes';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import { EmptyState } from '@/shared/ui/feedback/empty-state';
import PageHeader from '@/widgets/layout/ui/page-header';

import type {
  AgentProfile,
  AgentTasksMeta,
} from '@/features/agents/model/types';

/**
 *
 */
export default async function AgentsPage() {
  const { canManageAgents, activeOrganization } = await getAgentAccessContext();

  if (!canManageAgents) {
    return (
      <Card className='h-full flex flex-col'>
        <PageHeader title='Agents' />
        <CardBody>
          <AccessDeniedState />
        </CardBody>
      </Card>
    );
  }

  let tasksAccessDenied = false;
  let profilesAccessDenied = false;
  let activityAccessDenied = false;

  let tasks = [] as Awaited<ReturnType<typeof getAgentTasks>>['data'];
  let tasksTotal = 0;

  let profilesResponse: { data: AgentProfile[]; totalCount: number } = {
    data: [],
    totalCount: 0,
  };
  let meta = {} as AgentTasksMeta;
  let tools = [] as Awaited<ReturnType<typeof getAgentTools>>;

  let activityItems = [] as Awaited<
    ReturnType<typeof getAgentActivity>
  >['items'];
  let activityTotal = 0;

  await Promise.all([
    getAgentTasks()
      .then((r) => {
        tasks = r.data;
        tasksTotal = r.totalCount;
      })
      .catch((error) => {
        if (error instanceof ServerError && error.status === 403) {
          tasksAccessDenied = true;
        } else {
          throw error;
        }
      }),

    Promise.all([
      getAgentProfiles(),
      getAgentTasksMeta().catch(() => {
        return {} as AgentTasksMeta;
      }),
      getAgentTools().catch(() => {
        return [];
      }),
    ])
      .then(([pr, m, t]) => {
        profilesResponse = pr;
        meta = m as AgentTasksMeta;
        tools = t;
      })
      .catch((error) => {
        if (error instanceof ServerError && error.status === 403) {
          profilesAccessDenied = true;
        } else {
          throw error;
        }
      }),

    getAgentActivity()
      .then((r) => {
        activityItems = r.items;
        activityTotal = r.totalCount;
      })
      .catch((error) => {
        if (error instanceof ServerError && error.status === 403) {
          activityAccessDenied = true;
        } else {
          throw error;
        }
      }),
  ]);

  const toolOptions = normalizeToolOptions(tools);
  const sandboxOptions = normalizeMetaOptions(meta.sandbox_profiles);

  const tasksContent = tasksAccessDenied ? (
    <AccessDeniedState description='The backend denied access to agent tasks for the current organization context.' />
  ) : (
    <div>
      <div className='mb-6 flex flex-wrap items-center justify-between gap-3'>
        <p className='text-sm text-muted-foreground'>
          Active organization context: {activeOrganization?.name ?? 'Unknown'} ·{' '}
          {tasksTotal} tasks
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
    </div>
  );

  const profilesContent = profilesAccessDenied ? (
    <AccessDeniedState description='The backend denied access to agent profiles for the current organization context.' />
  ) : (
    <div>
      <div className='mb-6 flex flex-wrap items-center justify-between gap-3'>
        <p className='text-sm text-muted-foreground'>
          Configure reusable agent profiles and backend-constrained tool access.
        </p>
        <Link
          href={ROUTES.DASHBOARD.AGENT_PROFILES_NEW}
          className='inline-flex h-10 items-center justify-center rounded-[var(--radius-button)] bg-primary px-4 text-sm text-primary-foreground'
        >
          New profile
        </Link>
      </div>
      <div className='mb-6 grid gap-4 md:grid-cols-2'>
        <div className='rounded-[var(--radius-card)] border border-border p-4'>
          <p className='text-xs uppercase tracking-wide text-muted-foreground'>
            Sandbox profiles from meta
          </p>
          <p className='mt-2 text-sm text-foreground'>
            {sandboxOptions.length > 0
              ? sandboxOptions
                  .map((option) => {
                    return option.label;
                  })
                  .join(', ')
              : 'Not exposed by the backend meta endpoint'}
          </p>
        </div>
        <div className='rounded-[var(--radius-card)] border border-border p-4'>
          <p className='text-xs uppercase tracking-wide text-muted-foreground'>
            Tool catalog
          </p>
          <p className='mt-2 text-sm text-foreground'>
            {toolOptions.length > 0
              ? `${toolOptions.length} tools available from /api/v1/agent-tools`
              : 'Tool metadata endpoint returned no tools'}
          </p>
        </div>
      </div>
      {profilesResponse.data.length > 0 ? (
        <AgentProfilesList profiles={profilesResponse.data} />
      ) : (
        <EmptyState
          icon={Bot}
          title='No agent profiles yet'
          description='Create the first profile for reusable agent configuration.'
        />
      )}
    </div>
  );

  const activityContent = activityAccessDenied ? (
    <AccessDeniedState description='The backend denied access to agent activity for the current organization context.' />
  ) : (
    <div>
      <div className='mb-6 flex flex-wrap items-center justify-between gap-3'>
        <p className='text-sm text-muted-foreground'>
          Activity feed for all agents. Showing {activityTotal} entries.
        </p>
      </div>
      <AgentActivityFeed
        initialItems={activityItems}
        totalCount={activityTotal}
      />
    </div>
  );

  return (
    <Card className='h-full flex flex-col'>
      <PageHeader title='Agents' />
      <div className='h-full overflow-y-auto'>
        <CardBody>
          <AgentsTabs
            tasksContent={tasksContent}
            profilesContent={profilesContent}
            activityContent={activityContent}
          />
        </CardBody>
      </div>
    </Card>
  );
}
