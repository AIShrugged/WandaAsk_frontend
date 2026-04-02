import { format, parseISO } from 'date-fns';
import { Bot, ChevronRight, Clock, Zap } from 'lucide-react';
import Link from 'next/link';

import { ROUTES } from '@/shared/lib/routes';
import { Badge } from '@/shared/ui/badge';
import Card from '@/shared/ui/card/Card';

import type { AgentTask } from '@/features/agents/model/types';

const RUN_STATUS_VARIANT: Record<
  string,
  'default' | 'success' | 'warning' | 'destructive'
> = {
  completed: 'success',
  success: 'success',
  running: 'warning',
  failed: 'destructive',
  error: 'destructive',
};

/**
 * AgentTasksBlock — shows recent agent tasks with their run status,
 * plus a "Pending Approvals" section for agent questions awaiting user action.
 * @param root0
 * @param root0.tasks
 * @param root0.canManageAgents
 */
export function AgentTasksBlock({
  tasks,
  canManageAgents,
}: {
  tasks: AgentTask[];
  canManageAgents: boolean;
}) {
  const displayed = tasks.slice(0, 6);

  return (
    <Card className='flex flex-col gap-0'>
      <div className='flex items-center justify-between px-5 py-4 border-b border-border'>
        <div className='flex items-center gap-2'>
          <Zap className='h-4 w-4 text-primary' />
          <h2 className='text-base font-semibold text-foreground'>
            Agent Tasks
          </h2>
        </div>
        {canManageAgents && (
          <Link
            href={ROUTES.DASHBOARD.AGENT_TASKS}
            className='text-xs text-primary hover:underline'
          >
            View all
          </Link>
        )}
      </div>

      {/* Pending Approvals sub-section */}
      {/* Pending approvals: wire to backend approval API once contract is defined. */}
      {/* Backend gap: AgentTaskRun has no "awaiting_approval" status; handoff field is unknown type. */}
      <div className='px-5 pt-4 pb-2 border-b border-border/50'>
        <p className='text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3'>
          Pending Approvals
        </p>
        <div className='flex items-center gap-2 py-2'>
          <Clock className='h-4 w-4 text-muted-foreground/50' />
          <p className='text-sm text-muted-foreground'>No pending approvals</p>
        </div>
      </div>

      {/* Agent tasks list */}
      <div className='px-5'>
        {displayed.length === 0 ? (
          <p className='py-4 text-sm text-muted-foreground text-center'>
            No agent tasks configured
          </p>
        ) : (
          displayed.map((task) => {
            const runStatus = task.latest_run_status ?? null;
            const statusVariant =
              (runStatus && RUN_STATUS_VARIANT[runStatus.toLowerCase()]) ||
              'default';

            return (
              <Link
                key={task.id}
                href={`${ROUTES.DASHBOARD.AGENT_TASKS}/${task.id}`}
                className='flex items-center justify-between gap-3 py-3 border-b border-border/50 last:border-0 hover:bg-accent/20 -mx-5 px-5 transition-colors'
              >
                <div className='flex items-center gap-3 min-w-0'>
                  <div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-violet-500/10 text-violet-400'>
                    <Bot className='h-3.5 w-3.5' />
                  </div>
                  <div className='min-w-0'>
                    <p className='text-sm font-medium text-foreground truncate'>
                      {task.name}
                    </p>
                    {task.next_run_at && (
                      <p className='text-xs text-muted-foreground mt-0.5'>
                        Next:{' '}
                        {format(parseISO(task.next_run_at), 'MMM d, HH:mm')}
                      </p>
                    )}
                  </div>
                </div>
                <div className='flex items-center gap-2 shrink-0'>
                  {runStatus && (
                    <Badge variant={statusVariant} className='capitalize'>
                      {runStatus}
                    </Badge>
                  )}
                  {!task.enabled && <Badge variant='warning'>Disabled</Badge>}
                  <ChevronRight className='h-3.5 w-3.5 text-muted-foreground' />
                </div>
              </Link>
            );
          })
        )}
      </div>
    </Card>
  );
}
