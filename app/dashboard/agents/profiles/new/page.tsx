import { Bot } from 'lucide-react';

import {
  getAgentTasksMeta,
  getAgentTools,
  getAgentAccessContext,
  normalizeMetaOptions,
  normalizeToolOptions,
  AccessDeniedState,
  AgentProfileForm,
} from '@/features/agents';
import { ServerError } from '@/shared/lib/errors';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import { EmptyState } from '@/shared/ui/feedback/empty-state';
import PageHeader from '@/widgets/layout/ui/page-header';

import type { AgentTasksMeta } from '@/features/agents';

/**
 *
 */
export default async function NewAgentProfilePage() {
  const { canManageAgents } = await getAgentAccessContext();

  if (!canManageAgents) {
    return (
      <Card className='h-full flex flex-col'>
        <PageHeader hasButtonBack title='New Agent Profile' />
        <CardBody>
          <AccessDeniedState />
        </CardBody>
      </Card>
    );
  }

  let accessDenied = false;
  let meta = {} as AgentTasksMeta;
  let tools = [] as Awaited<ReturnType<typeof getAgentTools>>;

  try {
    [meta, tools] = await Promise.all([
      getAgentTasksMeta().catch(() => {
        return {} as AgentTasksMeta;
      }),
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
        <PageHeader hasButtonBack title='New Agent Profile' />
        <CardBody>
          <AccessDeniedState description='The backend denied access while loading profile creation metadata.' />
        </CardBody>
      </Card>
    );
  }

  const toolOptions = normalizeToolOptions(tools);

  if (toolOptions.length === 0) {
    return (
      <Card className='h-full flex flex-col'>
        <PageHeader hasButtonBack title='New Agent Profile' />
        <CardBody>
          <EmptyState
            icon={Bot}
            title='No agent tools available'
            description='The backend returned an empty /api/v1/agent-tools response, so profile creation is limited.'
          />
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className='h-full flex flex-col'>
      <PageHeader hasButtonBack title='New Agent Profile' />
      <div className='h-full overflow-y-auto'>
        <CardBody>
          <AgentProfileForm
            sandboxOptions={normalizeMetaOptions(meta.sandbox_profiles)}
            toolOptions={toolOptions}
          />
        </CardBody>
      </div>
    </Card>
  );
}
