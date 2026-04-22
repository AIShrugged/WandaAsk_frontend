import { notFound } from 'next/navigation';

import {
  getAgentProfiles,
  getAgentTask,
  getAgentTasksMeta,
  getAgentTools,
  getAgentAccessContext,
  normalizeMetaOptions,
  normalizeToolOptions,
  AgentTaskForm,
} from '@/features/agents';

/**
 * Agent task detail — Configuration tab.
 */
export default async function AgentTaskConfigPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profileId = Number(id);

  if (!Number.isFinite(profileId) || profileId <= 0) notFound();

  const { managerOrganizations } = await getAgentAccessContext();

  const [task, profilesResponse, meta, tools] = await Promise.all([
    getAgentTask(profileId),
    getAgentProfiles(),
    getAgentTasksMeta(),
    getAgentTools(),
  ]);

  if (!task || !meta) notFound();

  return (
    <div className='rounded-[var(--radius-card)] border border-border p-4'>
      <AgentTaskForm
        task={task}
        organizations={managerOrganizations}
        profiles={profilesResponse.data}
        executionModeOptions={normalizeMetaOptions(meta.execution_modes)}
        scheduleTypeOptions={normalizeMetaOptions(meta.schedule_types)}
        taskTypeOptions={normalizeMetaOptions(meta.agent_task_types)}
        outputModeOptions={normalizeMetaOptions(meta.output_modes)}
        toolOptions={normalizeToolOptions(tools)}
      />
    </div>
  );
}
