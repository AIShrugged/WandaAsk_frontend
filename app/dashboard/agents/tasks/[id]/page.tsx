import { Bot } from 'lucide-react';
import { notFound } from 'next/navigation';

import {
  getAgentProfiles,
  getAgentTask,
  getAgentTaskRun,
  getAgentTaskRuns,
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
import { AgentPageTabs } from '@/features/agents/ui/agent-page-tabs';
import { AgentTaskActions } from '@/features/agents/ui/agent-task-actions';
import { AgentTaskForm } from '@/features/agents/ui/agent-task-form';
import { AgentTaskOverview } from '@/features/agents/ui/agent-task-overview';
import { AgentTaskRunDetail } from '@/features/agents/ui/agent-task-run-detail';
import { AgentTaskRunsList } from '@/features/agents/ui/agent-task-runs-list';
import { ServerError } from '@/shared/lib/errors';
import { ROUTES } from '@/shared/lib/routes';
import { Badge } from '@/shared/ui/badge';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import { EmptyState } from '@/shared/ui/feedback/empty-state';
import PageHeader from '@/widgets/layout/ui/page-header';

import type { AgentProfile } from '@/features/agents/model/types';

const tabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'runs', label: 'Runs' },
  { key: 'config', label: 'Configuration' },
  { key: 'json', label: 'Raw JSON' },
] as const;

/**
 *
 * @param root0
 * @param root0.params
 * @param root0.searchParams
 */
export default async function AgentTaskDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;

  const profileId = Number(id);

  if (!Number.isFinite(profileId) || profileId <= 0) notFound();

  const query = await searchParams;

  const currentTab =
    typeof query.tab === 'string' &&
    tabs.some((tab) => {
      return tab.key === query.tab;
    })
      ? query.tab
      : 'overview';

  const selectedRunId =
    typeof query.runId === 'string' ? Number(query.runId) : undefined;

  const { canManageAgents, managerOrganizations } =
    await getAgentAccessContext();

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
  let profilesResponse: { data: AgentProfile[]; totalCount: number } = {
    data: [],
    totalCount: 0,
  };
  let meta = null as Awaited<ReturnType<typeof getAgentTasksMeta>> | null;
  let tools = [] as Awaited<ReturnType<typeof getAgentTools>>;
  let runsResponse = { data: [], totalCount: 0 } as Awaited<
    ReturnType<typeof getAgentTaskRuns>
  >;
  let selectedRun = null as Awaited<ReturnType<typeof getAgentTaskRun>> | null;

  try {
    [task, profilesResponse, meta, tools] = await Promise.all([
      getAgentTask(profileId),
      getAgentProfiles(),
      getAgentTasksMeta(),
      getAgentTools(),
    ]);

    runsResponse =
      currentTab === 'runs' || selectedRunId
        ? await getAgentTaskRuns(profileId)
        : runsResponse;

    selectedRun =
      selectedRunId && Number.isFinite(selectedRunId)
        ? await getAgentTaskRun(profileId, selectedRunId).catch(() => {
            return null;
          })
        : null;
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

  if (!task || !meta) notFound();

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
            <AgentPageTabs
              baseHref={`${ROUTES.DASHBOARD.AGENT_TASKS}/${task.id}`}
              currentTab={currentTab}
              tabs={tabs.map((tab) => {
                return { key: tab.key, label: tab.label };
              })}
            />
          </div>

          {currentTab === 'overview' ? (
            <div className='flex flex-col gap-6'>
              <AgentTaskOverview task={task} />
              <div className='rounded-[var(--radius-card)] border border-border p-4'>
                <p className='text-xs uppercase tracking-wide text-muted-foreground'>
                  Prompt
                </p>
                <pre className='mt-3 whitespace-pre-wrap text-sm text-foreground'>
                  {task.prompt || '—'}
                </pre>
              </div>
            </div>
          ) : null}

          {currentTab === 'runs' ? (
            <div className='flex flex-col gap-6'>
              {runsResponse.data.length > 0 ? (
                <>
                  <AgentTaskRunsList
                    taskId={task.id}
                    runs={runsResponse.data}
                    selectedRunId={selectedRunId}
                  />
                  {selectedRun ? (
                    <AgentTaskRunDetail run={selectedRun} />
                  ) : (
                    <EmptyState
                      icon={Bot}
                      title='Select a run'
                      description='Choose a run from the table to inspect output, tool calls, sandbox result, and raw JSON.'
                    />
                  )}
                </>
              ) : (
                <EmptyState
                  icon={Bot}
                  title='No runs yet'
                  description='Run the task manually or wait for the next scheduled execution.'
                />
              )}
            </div>
          ) : null}

          {currentTab === 'config' ? (
            <div className='rounded-[var(--radius-card)] border border-border p-4'>
              <AgentTaskForm
                task={task}
                organizations={managerOrganizations}
                profiles={profilesResponse.data}
                executionModeOptions={normalizeMetaOptions(
                  meta.execution_modes,
                )}
                scheduleTypeOptions={normalizeMetaOptions(meta.schedule_types)}
                taskTypeOptions={normalizeMetaOptions(meta.agent_task_types)}
                outputModeOptions={normalizeMetaOptions(meta.output_modes)}
                toolOptions={normalizeToolOptions(tools)}
              />
            </div>
          ) : null}

          {currentTab === 'json' ? (
            <AgentJsonPreview title='Raw JSON' value={task} />
          ) : null}
        </CardBody>
      </div>
    </Card>
  );
}
