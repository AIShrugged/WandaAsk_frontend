import { notFound } from 'next/navigation';

import { getAgentTask } from '@/features/agents/api/agents';
import { AgentTaskOverview } from '@/features/agents/ui/agent-task-overview';

/**
 * Agent task detail — Overview tab.
 */
export default async function AgentTaskOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profileId = Number(id);

  if (!Number.isFinite(profileId) || profileId <= 0) notFound();

  const task = await getAgentTask(profileId);

  if (!task) notFound();

  return (
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
  );
}
