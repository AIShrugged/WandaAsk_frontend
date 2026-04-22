import { Bot } from 'lucide-react';
import { notFound } from 'next/navigation';

import {
  getAgentTaskRun,
  getAgentTaskRuns,
  AgentTaskRunDetail,
  AgentTaskRunsList,
} from '@/features/agents';
import { EmptyState } from '@/shared/ui/feedback/empty-state';

/**
 * Agent task detail — Runs tab.
 */
export default async function AgentTaskRunsPage({
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
  const selectedRunId =
    typeof query.runId === 'string' ? Number(query.runId) : undefined;

  const runsResponse = await getAgentTaskRuns(profileId);

  const selectedRun =
    selectedRunId && Number.isFinite(selectedRunId)
      ? await getAgentTaskRun(profileId, selectedRunId).catch(() => {
          return null;
        })
      : null;

  if (runsResponse.data.length === 0) {
    return (
      <EmptyState
        icon={Bot}
        title='No runs yet'
        description='Run the task manually or wait for the next scheduled execution.'
      />
    );
  }

  return (
    <div className='flex flex-col gap-6'>
      <AgentTaskRunsList
        taskId={profileId}
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
    </div>
  );
}
