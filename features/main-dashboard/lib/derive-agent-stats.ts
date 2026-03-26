// eslint-disable-next-line boundaries/element-types
import type { AgentTask } from '@/features/agents/model/types';

export interface AgentStats {
  totalTasks: number;
  enabledTasks: number;
  successRate: number | null;
  failedRuns: number;
}

/**
 * Derives aggregate agent stats from a list of AgentTask objects.
 * Uses the `latest_run_status` field on each task.
 * @param tasks
 * @returns AgentStats derived from task run statuses.
 */
export function deriveAgentStats(tasks: AgentTask[]): AgentStats {
  const totalTasks = tasks.length;
  const enabledTasks = tasks.filter((t) => {
    return t.enabled;
  }).length;
  let completedRuns = 0;
  let failedRuns = 0;

  for (const task of tasks) {
    const status = task.latest_run_status?.toLowerCase() ?? null;

    if (status === 'completed' || status === 'success') {
      completedRuns++;
    } else if (status === 'failed' || status === 'error') {
      failedRuns++;
    }
  }

  const total = completedRuns + failedRuns;
  const successRate =
    total > 0 ? Math.round((completedRuns / total) * 100) : null;

  return { totalTasks, enabledTasks, successRate, failedRuns };
}
