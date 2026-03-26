import { Bot } from 'lucide-react';
import Link from 'next/link';

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
import { AgentProfilesList } from '@/features/agents/ui/agent-profiles-list';
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
export default async function AgentProfilesPage() {
  const { canManageAgents } = await getAgentAccessContext();

  if (!canManageAgents) {
    return (
      <Card className='h-full flex flex-col'>
        <PageHeader title='Agent Profiles' />
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
  let meta = {} as AgentTasksMeta;
  let tools = [] as Awaited<ReturnType<typeof getAgentTools>>;

  try {
    [profilesResponse, meta, tools] = await Promise.all([
      getAgentProfiles(),
      getAgentTasksMeta().catch(() => {
        return {} as AgentTasksMeta;
      }),
      getAgentTools().catch(() => {
        return [];
      }),
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
        <PageHeader title='Agent Profiles' />
        <CardBody>
          <AccessDeniedState description='The backend denied access to agent profiles for the current organization context.' />
        </CardBody>
      </Card>
    );
  }

  const profiles = profilesResponse.data;
  const toolOptions = normalizeToolOptions(tools);
  const sandboxOptions = normalizeMetaOptions(meta.sandbox_profiles);

  return (
    <Card className='h-full flex flex-col'>
      <PageHeader title='Agent Profiles' />
      <div className='h-full overflow-y-auto'>
        <CardBody>
          <div className='mb-6 flex flex-wrap items-center justify-between gap-3'>
            <p className='text-sm text-muted-foreground'>
              Configure reusable agent profiles and backend-constrained tool
              access.
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

          {profiles.length > 0 ? (
            <AgentProfilesList profiles={profiles} />
          ) : (
            <EmptyState
              icon={Bot}
              title='No agent profiles yet'
              description='Create the first profile for reusable agent configuration.'
            />
          )}
        </CardBody>
      </div>
    </Card>
  );
}
