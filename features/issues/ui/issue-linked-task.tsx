'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';

import { dispatchIssue } from '@/features/issues/api/issues';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button/Button';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';

import type { Issue, IssueAgentFlowStep } from '@/features/issues/model/types';

interface IssueLinkedTaskProps {
  issue: Issue;
}

/**
 *
 * @param status
 */
function runStatusVariant(
  status: string | null | undefined,
): 'success' | 'destructive' | 'warning' | 'primary' | 'default' {
  switch (status) {
    case 'completed': {
      return 'success';
    }
    case 'failed': {
      return 'destructive';
    }
    case 'running': {
      return 'primary';
    }
    case 'pending': {
      return 'warning';
    }
    default: {
      return 'default';
    }
  }
}

/**
 *
 * @param root0
 * @param root0.step
 */
function FlowStepRow({ step }: { step: IssueAgentFlowStep }) {
  const label = step.title ?? `Step ${step.position.toString()}`;
  const taskId = step.task?.id;
  const status = step.task?.status ?? step.status;

  return (
    <div className='flex items-center justify-between gap-3 rounded-[var(--radius-card)] border border-border bg-background/30 px-4 py-3'>
      <div className='flex min-w-0 flex-col gap-0.5'>
        <span className='truncate text-sm font-medium text-foreground'>
          {label}
        </span>
        {step.kind ? (
          <span className='text-xs text-muted-foreground'>{step.kind}</span>
        ) : null}
      </div>
      <div className='flex shrink-0 items-center gap-2'>
        {status ? (
          <Badge variant={runStatusVariant(status)}>{status}</Badge>
        ) : null}
        {taskId ? (
          <Link
            href={`/dashboard/agents/tasks/${taskId.toString()}`}
            className='text-xs text-muted-foreground transition-colors hover:text-primary'
          >
            →
          </Link>
        ) : null}
      </div>
    </div>
  );
}

/**
 *
 * @param root0
 * @param root0.issue
 */
export function IssueLinkedTask({ issue }: IssueLinkedTaskProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const flow = issue.agent_flow;
  const hasFlowSteps =
    flow && Array.isArray(flow.steps) && flow.steps.length > 0;

  const hasAnyTask = hasFlowSteps || Boolean(issue.agent_task_id);

  const handleDispatch = () => {
    startTransition(async () => {
      const result = await dispatchIssue(issue.id);

      if (result.error) {
        toast.error(result.error);

        return;
      }

      toast.success('Agent dispatched successfully');
      router.refresh();
    });
  };

  const dispatchLabel = isPending ? 'Dispatching…' : 'Dispatch Agent';
  const buttonLabel = hasAnyTask ? 'Re-dispatch' : dispatchLabel;

  return (
    <Card>
      <CardBody>
        <div className='flex flex-col gap-4'>
          <p className='text-xs uppercase tracking-[0.2em] text-muted-foreground'>
            Agent Tasks
          </p>

          {hasFlowSteps && (
            <div className='flex flex-col gap-2'>
              {flow.steps.map((step) => {
                return <FlowStepRow key={step.id} step={step} />;
              })}
            </div>
          )}

          {!hasFlowSteps && issue.agent_task_id ? (
            <div className='rounded-[var(--radius-card)] border border-border bg-background/30 p-4'>
              <Link
                href={`/dashboard/agents/tasks/${issue.agent_task_id.toString()}`}
                className='text-sm font-medium text-foreground transition-colors hover:text-primary'
              >
                Task #{issue.agent_task_id.toString()}
              </Link>
            </div>
          ) : null}

          {!hasFlowSteps && !issue.agent_task_id && (
            <p className='text-sm text-muted-foreground'>
              No agent task linked to this issue.
            </p>
          )}

          <Button
            type='button'
            className='w-full'
            onClick={handleDispatch}
            disabled={isPending}
          >
            {isPending ? 'Dispatching…' : buttonLabel}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
