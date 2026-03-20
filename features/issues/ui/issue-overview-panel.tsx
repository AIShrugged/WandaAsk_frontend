'use client';

import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { updateIssue } from '@/features/issues/api/issues';
import { ISSUE_STATUS_OPTIONS } from '@/features/issues/model/types';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button/Button';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import InputDropdown from '@/shared/ui/input/InputDropdown';

import type { Issue, IssueStatus } from '@/features/issues/model/types';

interface IssueOverviewPanelProps {
  issue: Issue;
}

/**
 *
 * @param value
 */
function formatDateTime(value: string) {
  return format(new Date(value), 'dd.MM.yyyy HH:mm');
}

/**
 *
 * @param status
 */
function formatStatusLabel(status: IssueStatus) {
  return (
    ISSUE_STATUS_OPTIONS.find((option) => {
      return option.value === status;
    })?.label ?? status
  );
}

/**
 *
 * @param status
 */
function statusVariant(status: IssueStatus) {
  switch (status) {
    case 'open': {
      return 'warning';
    }
    case 'in_progress': {
      return 'primary';
    }
    case 'paused': {
      return 'default';
    }
    case 'done': {
      return 'success';
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
 */
export function IssueOverviewPanel({ issue }: IssueOverviewPanelProps) {
  const router = useRouter();

  const [status, setStatus] = useState<IssueStatus>(issue.status);

  const [rootError, setRootError] = useState('');

  const [isPending, startTransition] = useTransition();

  const statusOptions = useMemo(() => {
    return ISSUE_STATUS_OPTIONS;
  }, []);

  let scopeValue = '—';

  if (issue.organization_id) {
    scopeValue = issue.team_id
      ? `Org #${issue.organization_id} · Team #${issue.team_id}`
      : `Org #${issue.organization_id}`;
  }

  const metadata = [
    { label: 'Type', value: issue.type || '—' },
    {
      label: 'Assignee',
      value:
        issue.assignee?.name ??
        (issue.assignee_id ? `User #${issue.assignee_id}` : 'Unassigned'),
    },
    {
      label: 'Scope',
      value: scopeValue,
    },
    { label: 'Created', value: formatDateTime(issue.created_at) },
    { label: 'Updated', value: formatDateTime(issue.updated_at) },
  ];

  /**
   *
   * @param nextStatus
   */
  const handleStatusChange = (nextStatus: IssueStatus) => {
    if (nextStatus === status) return;

    setStatus(nextStatus);
    setRootError('');

    startTransition(async () => {
      const result = await updateIssue(issue.id, {
        name: issue.name,
        description: issue.description,
        type: issue.type,
        status: nextStatus,
        organization_id: issue.organization_id,
        team_id: issue.team_id,
        assignee_id: issue.assignee_id,
      });

      if ('error' in result) {
        setStatus(issue.status);
        setRootError(result.error);

        return;
      }

      toast.success('Issue status updated');
      router.refresh();
    });
  };

  return (
    <Card>
      <CardBody>
        <div className='flex flex-col gap-5'>
          <div>
            <p className='text-xs uppercase tracking-[0.2em] text-muted-foreground'>
              Issue detail
            </p>
            <h2 className='mt-2 text-lg font-semibold text-foreground'>
              {issue.name}
            </h2>
          </div>

          <div className='rounded-[var(--radius-card)] border border-border bg-background/30 p-4'>
            <p className='text-sm font-medium text-foreground'>Status</p>
            <div className='mt-3 flex items-center gap-3'>
              <Badge variant={statusVariant(status)}>
                {formatStatusLabel(status)}
              </Badge>
              <InputDropdown
                label='Change status'
                options={statusOptions}
                value={status}
                onChange={(value) => {
                  handleStatusChange(value as IssueStatus);
                }}
                disabled={isPending}
                className='min-w-[180px]'
              />
            </div>
            {rootError ? (
              <p className='mt-3 text-sm text-destructive'>{rootError}</p>
            ) : null}
          </div>

          <div className='grid gap-3'>
            {metadata.map((item) => {
              return (
                <div
                  key={item.label}
                  className='flex items-start justify-between gap-4 rounded-[var(--radius-card)] border border-border bg-background/20 px-4 py-3'
                >
                  <span className='text-sm text-muted-foreground'>
                    {item.label}
                  </span>
                  <span className='text-right text-sm font-medium text-foreground'>
                    {item.value}
                  </span>
                </div>
              );
            })}
          </div>

          <Button
            type='button'
            className='w-full'
            onClick={() => {
              router.refresh();
            }}
            disabled={isPending}
          >
            Refresh details
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
