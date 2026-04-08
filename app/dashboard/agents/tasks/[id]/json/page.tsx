import { notFound } from 'next/navigation';

import { getAgentTask } from '@/features/agents/api/agents';
import { AgentJsonPreview } from '@/features/agents/ui/agent-json-preview';

/**
 * Agent task detail — Raw JSON tab.
 */
export default async function AgentTaskJsonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profileId = Number(id);

  if (!Number.isFinite(profileId) || profileId <= 0) notFound();

  const task = await getAgentTask(profileId);

  if (!task) notFound();

  return <AgentJsonPreview title='Raw JSON' value={task} />;
}
