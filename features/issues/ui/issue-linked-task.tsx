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

import type { Issue } from '@/features/issues/model/types';

interface LinkedAgentTask {
  id: number;
  name: string;
  latest_run_status?: string | null;
  latest_run?: unknown;
}

interface IssueLinkedTaskProps {
  issue: Issue;
  agentTask: LinkedAgentTask | null;
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
 * @param root0.issue
 * @param root0.agentTask
 */
export function IssueLinkedTask({ issue, agentTask }: IssueLinkedTaskProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const latestStatus =
    (agentTask?.latest_run as { status?: string } | null)?.status ??
    agentTask?.latest_run_status ??
    null;

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

  return (
    <Card>
      <CardBody>
        <div className='flex flex-col gap-4'>
          <p className='text-xs uppercase tracking-[0.2em] text-muted-foreground'>
            Agent Task
          </p>

          {agentTask ? (
            <div className='flex flex-col gap-3'>
              <div className='rounded-[var(--radius-card)] border border-border bg-background/30 p-4'>
                <Link
                  href={`/dashboard/agents/tasks/${agentTask.id}`}
                  className='text-sm font-medium text-foreground hover:text-primary transition-colors'
                >
                  {agentTask.name}
                </Link>
                {latestStatus ? (
                  <div className='mt-2'>
                    <Badge variant={runStatusVariant(latestStatus)}>
                      {latestStatus}
                    </Badge>
                  </div>
                ) : null}
              </div>

              <Button
                type='button'
                className='w-full'
                onClick={handleDispatch}
                disabled={isPending}
              >
                {isPending ? 'Dispatching…' : 'Re-dispatch'}
              </Button>
            </div>
          ) : (
            <div className='flex flex-col gap-3'>
              <p className='text-sm text-muted-foreground'>
                No agent task linked to this issue.
              </p>
              <Button
                type='button'
                className='w-full'
                onClick={handleDispatch}
                disabled={isPending}
              >
                {isPending ? 'Dispatching…' : 'Dispatch Agent'}
              </Button>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
