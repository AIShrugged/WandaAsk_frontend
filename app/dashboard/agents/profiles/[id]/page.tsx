import { notFound } from 'next/navigation';

import {
  getAgentProfile,
  getAgentTasksMeta,
  getAgentTools,
} from '@/features/agents/api/agents';
import { getAgentAccessContext } from '@/features/agents/lib/access';
import {
  formatDateTime,
  normalizeMetaOptions,
  normalizeToolOptions,
} from '@/features/agents/lib/format';
import { AccessDeniedState } from '@/features/agents/ui/access-denied-state';
import { AgentJsonPreview } from '@/features/agents/ui/agent-json-preview';
import { AgentProfileForm } from '@/features/agents/ui/agent-profile-form';
import { AgentProfileActions } from '@/features/agents/ui/agent-task-actions';
import { ServerError } from '@/shared/lib/errors';
import { ROUTES } from '@/shared/lib/routes';
import { Badge } from '@/shared/ui/badge';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import PageHeader from '@/widgets/layout/ui/page-header';

import type { AgentTasksMeta } from '@/features/agents/model/types';

/**
 *
 * @param root0
 * @param root0.params
 */
export default async function AgentProfileDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profileId = Number(id);

  if (!Number.isFinite(profileId) || profileId <= 0) notFound();

  const { canManageAgents } = await getAgentAccessContext();

  if (!canManageAgents) {
    return (
      <Card className='h-full flex flex-col'>
        <PageHeader hasButtonBack title='Agent Profile' />
        <CardBody>
          <AccessDeniedState />
        </CardBody>
      </Card>
    );
  }

  let accessDenied = false;
  let profile = null as Awaited<ReturnType<typeof getAgentProfile>> | null;
  let meta = {} as AgentTasksMeta;
  let tools = [] as Awaited<ReturnType<typeof getAgentTools>>;

  try {
    [profile, meta, tools] = await Promise.all([
      getAgentProfile(profileId),
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
        <PageHeader hasButtonBack title='Agent Profile' />
        <CardBody>
          <AccessDeniedState description='The backend denied access to this agent profile.' />
        </CardBody>
      </Card>
    );
  }

  if (!profile) notFound();

  return (
    <Card className='h-full flex flex-col'>
      <PageHeader hasButtonBack title={profile.name} />
      <div className='h-full overflow-y-auto'>
        <CardBody>
          <div className='mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
            <div className='flex flex-col gap-2 min-w-0'>
              <p className='text-sm text-muted-foreground'>
                Created {formatDateTime(profile.created_at)} · Updated{' '}
                {formatDateTime(profile.updated_at)}
              </p>
              <div className='flex flex-wrap gap-2'>
                {(profile.allowed_tools ?? []).map((tool) => {
                  return <Badge key={tool}>{tool}</Badge>;
                })}
              </div>
            </div>
            <div className='shrink-0'>
              <AgentProfileActions
                id={profile.id}
                backHref={ROUTES.DASHBOARD.AGENT_PROFILES}
              />
            </div>
          </div>

          <div className='grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]'>
            <div className='rounded-[var(--radius-card)] border border-border p-4'>
              <AgentProfileForm
                profile={profile}
                sandboxOptions={normalizeMetaOptions(meta.sandbox_profiles)}
                toolOptions={normalizeToolOptions(tools)}
              />
            </div>
            <div className='flex flex-col gap-6'>
              <div className='rounded-[var(--radius-card)] border border-border p-4'>
                <p className='text-xs uppercase tracking-wide text-muted-foreground'>
                  Overview
                </p>
                <div className='mt-3 space-y-2 text-sm text-foreground'>
                  <p>Name: {profile.name}</p>
                  <p>Description: {profile.description || '—'}</p>
                  <p>Sandbox: {profile.sandbox_profile || '—'}</p>
                  <p>Model: {profile.model ?? '—'}</p>
                  <div>
                    <p className='text-muted-foreground'>System Prompt:</p>
                    <p className='mt-1 whitespace-pre-wrap break-words'>
                      {profile.system_prompt || '—'}
                    </p>
                  </div>
                </div>
              </div>
              <AgentJsonPreview
                title='Config'
                value={profile.config}
                emptyLabel='No config returned by the backend'
              />
              <AgentJsonPreview title='Raw JSON' value={profile} />
            </div>
          </div>
        </CardBody>
      </div>
    </Card>
  );
}
