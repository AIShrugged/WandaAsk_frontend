'use client';

import { formatDateTime, formatDuration } from '@/features/agents/lib/format';
import { Badge } from '@/shared/ui/badge';
import Card from '@/shared/ui/card/Card';
import { Skeleton } from '@/shared/ui/layout/skeleton';

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
 * Inline runs list for the detail panel — uses callbacks instead of Link navigation.
 * @param root0
 * @param root0.runs
 * @param root0.selectedRunId
 * @param root0.onSelectRun
 * @param root0.loading
 */
export function InlineRunsList({
  runs,
  selectedRunId,
  onSelectRun,
  loading,
}: {
  runs: AgentTaskRun[];
  selectedRunId?: number;
  onSelectRun: (runId: number) => void;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className='flex flex-col gap-2'>
        <Skeleton className='h-10 rounded-[var(--radius-card)]' />
        <Skeleton className='h-10 rounded-[var(--radius-card)]' />
        <Skeleton className='h-10 rounded-[var(--radius-card)]' />
      </div>
    );
  }

  return (
    <div className='overflow-x-auto'>
      <table className='w-full text-sm'>
        <thead className='bg-accent/30 text-left text-muted-foreground'>
          <tr>
            <th className='px-3 py-2 font-medium'>Status</th>
            <th className='px-3 py-2 font-medium'>Attempt</th>
            <th className='px-3 py-2 font-medium'>Started</th>
            <th className='px-3 py-2 font-medium'>Duration</th>
            <th className='px-3 py-2 font-medium'>Details</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => {
            const isSelected = selectedRunId === run.id;

            return (
              <tr
                key={run.id}
                className={`border-b border-border/60 align-top text-foreground transition-colors cursor-pointer ${
                  isSelected ? 'bg-accent/20' : 'hover:bg-accent/10'
                }`}
                onClick={() => {
                  onSelectRun(run.id);
                }}
              >
                <td className='px-3 py-2'>
                  <Badge variant={getStatusVariant(run.status)}>
                    {run.status}
                  </Badge>
                </td>
                <td className='px-3 py-2'>{run.attempt ?? '—'}</td>
                <td className='px-3 py-2 text-muted-foreground'>
                  {formatDateTime(run.started_at)}
                </td>
                <td className='px-3 py-2'>{formatDuration(run)}</td>
                <td className='px-3 py-2'>
                  <span className='text-xs text-primary'>Run #{run.id}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Compact run detail card for inline display.
 * @param root0
 * @param root0.run
 */
export function InlineRunDetail({ run }: { run: AgentTaskRun }) {
  return (
    <Card className='p-3 border-border/60'>
      <div className='flex items-center gap-2 mb-3'>
        <Badge variant={getStatusVariant(run.status)}>{run.status}</Badge>
        <span className='text-xs text-muted-foreground'>
          Run #{run.id}
          {run.attempt == null ? '' : ` · attempt ${run.attempt}`}
        </span>
      </div>

      <div className='grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground mb-3'>
        <span>Scheduled: {formatDateTime(run.scheduled_for)}</span>
        <span>Started: {formatDateTime(run.started_at)}</span>
        <span>Finished: {formatDateTime(run.finished_at)}</span>
        <span>Duration: {formatDuration(run)}</span>
      </div>

      {run.output != null && (
        <pre className='overflow-x-auto whitespace-pre-wrap rounded bg-background/60 p-3 text-xs text-foreground'>
          {typeof run.output === 'string'
            ? run.output
            : JSON.stringify(run.output, null, 2)}
        </pre>
      )}

      {run.error_message && (
        <div className='mt-3 rounded border border-destructive/30 bg-destructive/10 p-2 text-xs text-red-300'>
          {run.error_message}
        </div>
      )}
    </Card>
  );
}
