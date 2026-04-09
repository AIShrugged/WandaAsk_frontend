import { Bot } from 'lucide-react';

import {
  getAgentProfiles,
  getAgentTasksMeta,
  getAgentTools,
} from '@/features/agents/api/agents';
import { getAgentAccessContext } from '@/features/agents/lib/access';
import {
  normalizeMetaOptions,
  normalizeToolOptions,
} from '@/features/agents/lib/format';
import { AccessDeniedState } from '@/features/agents/ui/access-denied-state';
import { AgentTaskForm } from '@/features/agents/ui/agent-task-form';
import { ServerError } from '@/shared/lib/errors';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import { EmptyState } from '@/shared/ui/feedback/empty-state';
import PageHeader from '@/widgets/layout/ui/page-header';

import type { AgentProfile } from '@/features/agents/model/types';

/**
 *
 */
export default async function NewAgentTaskPage() {
  const { canManageAgents, managerOrganizations } =
    await getAgentAccessContext();

  if (!canManageAgents) {
    return (
      <Card className='h-full flex flex-col'>
        <PageHeader hasButtonBack title='New Agent Task' />
        <CardBody>
          <AccessDeniedState />
        </CardBody>
      </Card>
    );
  }

  let accessDenied = false;
  let profilesResponse: { data: AgentProfile[]; totalCount: number } = {
    data: [],
    totalCount: 0,
  };
  let meta = null as Awaited<ReturnType<typeof getAgentTasksMeta>> | null;
  let tools = [] as Awaited<ReturnType<typeof getAgentTools>>;

  try {
    [profilesResponse, meta, tools] = await Promise.all([
      getAgentProfiles(),
      getAgentTasksMeta(),
      getAgentTools(),
    ]);
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
        <PageHeader hasButtonBack title='New Agent Task' />
        <CardBody>
          <AccessDeniedState description='The backend denied access while loading task metadata.' />
        </CardBody>
      </Card>
    );
  }

  if (!meta || profilesResponse.data.length === 0) {
    return (
      <Card className='h-full flex flex-col'>
        <PageHeader hasButtonBack title='New Agent Task' />
        <CardBody>
          <EmptyState
            icon={Bot}
            title='Create an agent profile first'
            description='Tasks require an existing agent profile from the backend.'
          />
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className='h-full flex flex-col'>
      <PageHeader hasButtonBack title='New Agent Task' />
      <div className='h-full overflow-y-auto'>
        <CardBody>
          <AgentTaskForm
            organizations={managerOrganizations}
            profiles={profilesResponse.data}
            executionModeOptions={normalizeMetaOptions(meta.execution_modes)}
            scheduleTypeOptions={normalizeMetaOptions(meta.schedule_types)}
            taskTypeOptions={normalizeMetaOptions(meta.agent_task_types)}
            outputModeOptions={normalizeMetaOptions(meta.output_modes)}
            toolOptions={normalizeToolOptions(tools)}
          />
        </CardBody>
      </div>
    </Card>
  );
}
