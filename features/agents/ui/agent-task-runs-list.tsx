import Link from 'next/link';

import { formatDateTime, formatDuration } from '@/features/agents/lib/format';
import { Badge } from '@/shared/ui/badge';

import type { AgentTaskRun } from '@/features/agents/model/types';

/**
 *
 * @param status
 */
function getStatusVariant(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === 'completed' || normalized === 'success') return 'success';

  if (normalized === 'failed' || normalized === 'error') return 'destructive';

  return 'warning';
}

/**
 *
 * @param root0
 * @param root0.taskId
 * @param root0.runs
 * @param root0.selectedRunId
 */
export function AgentTaskRunsList({
  taskId,
  runs,
  selectedRunId,
}: {
  taskId: number;
  runs: AgentTaskRun[];
  selectedRunId?: number;
}) {
  return (
    <div className='overflow-x-auto'>
      <table className='w-full min-w-[900px] text-sm'>
        <thead className='bg-accent/30 text-left text-muted-foreground'>
          <tr>
            <th className='px-4 py-3 font-medium'>Status</th>
            <th className='px-4 py-3 font-medium'>Attempt</th>
            <th className='px-4 py-3 font-medium'>Scheduled</th>
            <th className='px-4 py-3 font-medium'>Started</th>
            <th className='px-4 py-3 font-medium'>Finished</th>
            <th className='px-4 py-3 font-medium'>Duration</th>
            <th className='px-4 py-3 font-medium'>Details</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => {
            const href = `/dashboard/agents/tasks/${taskId}?tab=runs&runId=${run.id}`;

            return (
              <tr
                key={run.id}
                className={`border-b border-border/60 align-top text-foreground ${
                  selectedRunId === run.id ? 'bg-accent/20' : ''
                }`}
              >
                <td className='px-4 py-3'>
                  <Badge variant={getStatusVariant(run.status)}>
                    {run.status}
                  </Badge>
                </td>
                <td className='px-4 py-3'>{run.attempt ?? '—'}</td>
                <td className='px-4 py-3 text-muted-foreground'>
                  {formatDateTime(run.scheduled_for)}
                </td>
                <td className='px-4 py-3 text-muted-foreground'>
                  {formatDateTime(run.started_at)}
                </td>
                <td className='px-4 py-3 text-muted-foreground'>
                  {formatDateTime(run.finished_at)}
                </td>
                <td className='px-4 py-3'>{formatDuration(run)}</td>
                <td className='px-4 py-3'>
                  <Link href={href} className='text-primary hover:underline'>
                    Open run #{run.id}
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
