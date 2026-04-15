'use client';

import { format, parseISO } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, ChevronRight, Clock, X, Zap } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { ROUTES } from '@/shared/lib/routes';
import { Badge } from '@/shared/ui/badge';
import Card from '@/shared/ui/card/Card';

import { AgentTaskDetailPanel } from './agent-task-detail-panel';

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

const TASKS_CAP = 6;

/**
 * AgentTasksBlock — shows recent agent tasks with their run status,
 * plus a "Pending Approvals" section for agent questions awaiting user action.
 * Clicking a row opens an inline detail panel at 50% width.
 * Clicking the task name navigates to the full task page.
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
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  const displayed = tasks.slice(0, TASKS_CAP);
  const hasMore = tasks.length > TASKS_CAP;

  const selectedTask =
    tasks.find((t) => {
      return t.id === selectedTaskId;
    }) ?? null;

  return (
    <Card className='flex flex-row gap-0 overflow-hidden'>
      <div className='flex flex-col flex-1 min-w-0'>
        <div className='flex items-center px-5 py-4 border-b border-border'>
          <div className='flex items-center gap-2'>
            <Zap className='h-4 w-4 text-primary' />
            <h2 className='text-base font-semibold text-foreground'>
              Agent Tasks
            </h2>
          </div>
        </div>

        {/* Pending Approvals sub-section */}
        {/* Pending approvals: wire to backend approval API once contract is defined. */}
        {/* Backend gap: AgentTaskRun has no "awaiting_approval" status; handoff field is unknown type. */}
        <div className='px-5 pt-4 pb-2 border-b border-border/50'>
          <p className='text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3'>
            Pending Approvals
          </p>
          <div className='flex items-center gap-2 py-2'>
            <Clock
              className='h-4 w-4 text-muted-foreground/50'
              aria-hidden='true'
            />
            <p className='text-sm text-muted-foreground'>
              No pending approvals
            </p>
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
              const isSelected = selectedTaskId === task.id;

              return (
                <div
                  key={task.id}
                  role='button'
                  tabIndex={0}
                  onClick={() => {
                    setSelectedTaskId(task.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ')
                      setSelectedTaskId(task.id);
                  }}
                  className={`flex items-center justify-between gap-3 py-3 border-b border-border/50 last:border-0 -mx-5 px-5 transition-colors cursor-pointer ${
                    isSelected ? 'bg-accent/30' : 'hover:bg-accent/20'
                  }`}
                >
                  <div className='flex items-center gap-3 min-w-0 flex-1'>
                    <div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-violet-500/10 text-violet-400'>
                      <Bot className='h-3.5 w-3.5' />
                    </div>
                    <div className='min-w-0'>
                      <p className='text-sm font-medium text-foreground truncate'>
                        <Link
                          href={`${ROUTES.DASHBOARD.AGENT_TASKS}/${task.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          className='hover:text-primary transition-colors'
                        >
                          {task.name}
                        </Link>
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
                </div>
              );
            })
          )}
        </div>

        {hasMore && canManageAgents && (
          <div className='px-5 py-3 border-t border-border'>
            <Link
              href={ROUTES.DASHBOARD.AGENT_TASKS}
              className='text-xs text-primary hover:underline'
            >
              +{tasks.length - TASKS_CAP} more — View all tasks
            </Link>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedTask && (
          <motion.div
            key='task-detail'
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '50%', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className='shrink-0 border-l border-border overflow-hidden overflow-y-auto min-w-[280px]'
          >
            <div className='flex justify-end px-3 pt-3'>
              <button
                type='button'
                onClick={() => {
                  setSelectedTaskId(null);
                }}
                className='rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors'
                aria-label='Close detail panel'
              >
                <X className='h-4 w-4' />
              </button>
            </div>
            <AgentTaskDetailPanel task={selectedTask} />
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
