import {
  formatDateTime,
  formatDuration,
  getPlanOrHandoff,
  getSandboxResult,
  getToolCalls,
} from '@/features/agents/lib/format';
import { AgentJsonPreview } from '@/features/agents/ui/agent-json-preview';
import { AgentRunStatusBadge } from '@/features/agents/ui/agent-run-status-badge';

import type { AgentTaskRun } from '@/features/agents/model/types';

/**
 *
 * @param root0
 * @param root0.run
 */
export function AgentTaskRunDetail({ run }: { run: AgentTaskRun }) {
  const toolCalls = getToolCalls(run);
  const sandboxResult = getSandboxResult(run);
  const { plan, handoff, lineage } = getPlanOrHandoff(run);

  return (
    <div className='flex flex-col gap-6'>
      <section className='grid gap-4 md:grid-cols-3'>
        <div className='rounded-[var(--radius-card)] border border-border p-4'>
          <p className='text-xs uppercase tracking-wide text-muted-foreground'>
            Summary
          </p>
          <div className='mt-3 flex flex-col gap-2 text-sm'>
            <div className='flex items-center gap-2'>
              <span>Status</span>
              <AgentRunStatusBadge status={run.status} />
            </div>
            <p>Attempt: {run.attempt ?? '—'}</p>
            <p>Scheduled: {formatDateTime(run.scheduled_for)}</p>
            <p>Started: {formatDateTime(run.started_at)}</p>
            <p>Finished: {formatDateTime(run.finished_at)}</p>
            <p>Duration: {formatDuration(run)}</p>
          </div>
        </div>

        <div className='rounded-[var(--radius-card)] border border-border p-4 md:col-span-2'>
          <p className='text-xs uppercase tracking-wide text-muted-foreground'>
            Output
          </p>
          {typeof run.output === 'string' ? (
            <pre className='mt-3 overflow-x-auto whitespace-pre-wrap rounded-[var(--radius-card)] bg-background/60 p-4 text-sm text-foreground'>
              {run.output}
            </pre>
          ) : (
            <div className='mt-3'>
              <AgentJsonPreview title='Output JSON' value={run.output} />
            </div>
          )}
          {run.error_message ? (
            <div className='mt-4 rounded-[var(--radius-card)] border border-destructive/30 bg-destructive/10 p-4 text-sm text-red-300'>
              {run.error_message}
            </div>
          ) : null}
        </div>
      </section>

      <AgentJsonPreview
        title='Tool Calls'
        value={toolCalls}
        emptyLabel='No tool calls'
      />
      <AgentJsonPreview
        title='Sandbox Result'
        value={sandboxResult}
        emptyLabel='No sandbox result'
      />
      <AgentJsonPreview title='Plan' value={plan} emptyLabel='No plan data' />
      <AgentJsonPreview
        title='Handoff'
        value={handoff}
        emptyLabel='No handoff data'
      />
      <AgentJsonPreview
        title='Lineage / Follow-up'
        value={lineage}
        emptyLabel='No lineage data'
      />
      <AgentJsonPreview title='Raw JSON' value={run} />
    </div>
  );
}
