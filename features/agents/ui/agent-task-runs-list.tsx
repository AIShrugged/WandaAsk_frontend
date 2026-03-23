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
    <>
      {/* Mobile card list — hidden on md+ */}
      <div className='flex flex-col gap-3 md:hidden'>
        {runs.map((run) => {
          const href = `/dashboard/agents/tasks/${taskId}?tab=runs&runId=${run.id}`;

          const isSelected = selectedRunId === run.id;

          return (
            <Link
              key={run.id}
              href={href}
              className={[
                'block rounded-[var(--radius-card)] border border-border p-4 transition-colors',
                isSelected ? 'bg-accent/20' : 'hover:bg-accent/30',
              ].join(' ')}
            >
              <div className='flex items-center justify-between gap-2'>
                <Badge variant={getStatusVariant(run.status)}>
                  {run.status}
                </Badge>
                <span className='text-xs text-muted-foreground'>
                  Run #{run.id}
                  {run.attempt == null ? '' : ` · attempt ${run.attempt}`}
                </span>
              </div>
              <div className='mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground'>
                <span>Started: {formatDateTime(run.started_at)}</span>
                <span>Finished: {formatDateTime(run.finished_at)}</span>
                <span>Duration: {formatDuration(run)}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Desktop table — hidden below md */}
      <div className='hidden md:block overflow-x-auto'>
        <table className='w-full min-w-[700px] text-sm'>
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
    </>
  );
}
