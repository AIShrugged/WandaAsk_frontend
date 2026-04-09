import {
  formatDateTime,
  getLatestRunStatus,
  getOrganizationLabel,
  getTeamLabel,
} from '@/features/agents/lib/format';
import { Badge } from '@/shared/ui/badge';

import type { AgentTask } from '@/features/agents/model/types';

/**
 *
 * @param root0
 * @param root0.task
 */
export function AgentTaskOverview({ task }: { task: AgentTask }) {
  return (
    <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
      <div className='rounded-[var(--radius-card)] border border-border p-4'>
        <p className='text-xs uppercase tracking-wide text-muted-foreground'>
          Scope
        </p>
        <div className='mt-3 space-y-2 text-sm text-foreground'>
          <p>{getOrganizationLabel(task.organization, task.organization_id)}</p>
          <p>{getTeamLabel(task.team, task.team_id)}</p>
        </div>
      </div>
      <div className='rounded-[var(--radius-card)] border border-border p-4'>
        <p className='text-xs uppercase tracking-wide text-muted-foreground'>
          Agent
        </p>
        <div className='mt-3 space-y-2 text-sm text-foreground'>
          <p>
            {task.agent_profile?.name ??
              (task.agent_profile_id
                ? `Profile #${task.agent_profile_id}`
                : '—')}
          </p>
          <p>{task.execution_mode || '—'}</p>
        </div>
      </div>
      <div className='rounded-[var(--radius-card)] border border-border p-4'>
        <p className='text-xs uppercase tracking-wide text-muted-foreground'>
          Schedule
        </p>
        <div className='mt-3 space-y-2 text-sm text-foreground'>
          <p>{task.schedule_type || '—'}</p>
          <p>
            {task.interval_seconds
              ? `${task.interval_seconds} sec`
              : 'No interval'}
          </p>
          <p>{formatDateTime(task.next_run_at)}</p>
        </div>
      </div>
      <div className='rounded-[var(--radius-card)] border border-border p-4'>
        <p className='text-xs uppercase tracking-wide text-muted-foreground'>
          State
        </p>
        <div className='mt-3 space-y-2 text-sm text-foreground'>
          <Badge variant={task.enabled ? 'success' : 'warning'}>
            {task.enabled ? 'Enabled' : 'Disabled'}
          </Badge>
          <p>Latest run: {getLatestRunStatus(task)}</p>
          <p>Updated: {formatDateTime(task.updated_at)}</p>
        </div>
      </div>
    </div>
  );
}
