'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { answerAgentFlow, dispatchIssue } from '@/features/issues/api/issues';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button/Button';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import Textarea from '@/shared/ui/input/textarea';

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
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [answerText, setAnswerText] = useState('');

  const runStatus = issue.agent_task_run?.status;
  const isProcessing = runStatus === 'queued' || runStatus === 'processing';
  const isWaitingForUser = issue.agent_flow?.status === 'waiting_for_user';

  useEffect(() => {
    if (isProcessing && !pollingRef.current) {
      pollingRef.current = setInterval(() => {
        router.refresh();
      }, 3000);
    }

    if (!isProcessing && pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [isProcessing, router]);

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

  const handleAnswer = () => {
    if (!answerText.trim()) return;
    startTransition(async () => {
      const result = await answerAgentFlow(issue.id, answerText.trim());
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Answer submitted');
      setAnswerText('');
      router.refresh();
    });
  };

  const dispatchLabel = isPending ? 'Dispatching…' : 'Dispatch Agent';
  const buttonLabel = hasAnyTask ? 'Re-dispatch' : dispatchLabel;
  let buttonText = buttonLabel;

  if (isProcessing) {
    buttonText = 'Agent is working…';
  } else if (isPending) {
    buttonText = 'Dispatching…';
  }

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
              <div className='flex items-center justify-between'>
                <Link
                  href={`/dashboard/agents/tasks/${issue.agent_task_id.toString()}`}
                  className='text-sm font-medium text-foreground transition-colors hover:text-primary'
                >
                  Task #{issue.agent_task_id.toString()}
                </Link>
                {issue.agent_task_run?.status ? (
                  <Badge
                    variant={runStatusVariant(issue.agent_task_run.status)}
                  >
                    {issue.agent_task_run.status}
                  </Badge>
                ) : null}
              </div>
              {isProcessing &&
              issue.agent_task_run?.current_tool_description ? (
                <p className='mt-2 text-xs text-muted-foreground animate-pulse'>
                  {issue.agent_task_run.current_tool_description.split('. ')[0]}
                  …
                </p>
              ) : null}
            </div>
          ) : null}

          {!hasFlowSteps && !issue.agent_task_id && (
            <p className='text-sm text-muted-foreground'>
              No agent task linked to this issue.
            </p>
          )}

          {isWaitingForUser && (
            <div className='flex flex-col gap-2 rounded-[var(--radius-card)] border border-amber-500/30 bg-amber-500/10 p-3'>
              <p className='text-sm font-medium text-amber-400'>
                Agent is waiting for your input
              </p>
              <Textarea
                value={answerText}
                onChange={(e) => {
                  setAnswerText(e.target.value);
                }}
                placeholder='Enter your answer...'
                resizable={false}
                height={80}
                maxLength={5000}
              />
              <Button
                type='button'
                className='w-full'
                onClick={handleAnswer}
                disabled={isPending || !answerText.trim()}
                loading={isPending}
              >
                Submit Answer
              </Button>
            </div>
          )}

          <Button
            type='button'
            className='w-full'
            onClick={handleDispatch}
            disabled={isPending || isProcessing}
          >
            {buttonText}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
