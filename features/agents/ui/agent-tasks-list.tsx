import Link from 'next/link';

import {
  formatBooleanLabel,
  formatDateTime,
  getLatestRunStatus,
  getOrganizationLabel,
  getTeamLabel,
} from '@/features/agents/lib/format';
import { ROUTES } from '@/shared/lib/routes';
import { Badge } from '@/shared/ui/badge';

import type { AgentTask } from '@/features/agents/model/types';

/**
 *
 * @param enabled
 */
function getTaskStatusVariant(enabled: boolean) {
  return enabled ? 'success' : 'warning';
}

/**
 *
 * @param root0
 * @param root0.tasks
 */
export function AgentTasksList({ tasks }: { tasks: AgentTask[] }) {
  return (
    <div className='overflow-x-auto'>
      <table className='w-full min-w-[1200px] text-sm'>
        <thead className='bg-accent/30 text-left text-muted-foreground'>
          <tr>
            <th className='px-4 py-3 font-medium'>Name</th>
            <th className='px-4 py-3 font-medium'>Organization</th>
            <th className='px-4 py-3 font-medium'>Team</th>
            <th className='px-4 py-3 font-medium'>Profile</th>
            <th className='px-4 py-3 font-medium'>Execution</th>
            <th className='px-4 py-3 font-medium'>Schedule</th>
            <th className='px-4 py-3 font-medium'>Task type</th>
            <th className='px-4 py-3 font-medium'>State</th>
            <th className='px-4 py-3 font-medium'>Next run</th>
            <th className='px-4 py-3 font-medium'>Latest run</th>
            <th className='px-4 py-3 font-medium'>Updated</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            return (
              <tr
                key={task.id}
                className='border-b border-border/60 align-top text-foreground'
              >
                <td className='px-4 py-3'>
                  <Link
                    href={`${ROUTES.DASHBOARD.AGENT_TASKS}/${task.id}`}
                    className='font-medium text-primary hover:underline'
                  >
                    {task.name}
                  </Link>
                </td>
                <td className='px-4 py-3'>
                  {getOrganizationLabel(
                    task.organization,
                    task.organization_id,
                  )}
                </td>
                <td className='px-4 py-3'>
                  {getTeamLabel(task.team, task.team_id)}
                </td>
                <td className='px-4 py-3'>
                  {task.agent_profile?.name ??
                    (task.agent_profile_id
                      ? `Profile #${task.agent_profile_id}`
                      : '—')}
                </td>
                <td className='px-4 py-3'>{task.execution_mode || '—'}</td>
                <td className='px-4 py-3'>{task.schedule_type || '—'}</td>
                <td className='px-4 py-3'>{task.agent_task_type || '—'}</td>
                <td className='px-4 py-3'>
                  <Badge variant={getTaskStatusVariant(task.enabled)}>
                    {formatBooleanLabel(task.enabled)}
                  </Badge>
                </td>
                <td className='px-4 py-3 text-muted-foreground'>
                  {formatDateTime(task.next_run_at)}
                </td>
                <td className='px-4 py-3'>{getLatestRunStatus(task)}</td>
                <td className='px-4 py-3 text-muted-foreground'>
                  {formatDateTime(task.updated_at)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
