import { Badge } from '@/shared/ui/badge';

import type { IssueStatus } from '../model/types';

const VARIANT: Record<
  IssueStatus,
  React.ComponentProps<typeof Badge>['variant']
> = {
  open: 'warning',
  in_progress: 'primary',
  paused: 'default',
  done: 'success',
  review: 'primary',
  reopen: 'destructive',
};

const LABEL: Record<IssueStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  paused: 'Paused',
  done: 'Done',
  review: 'Review',
  reopen: 'Reopened',
};

interface IssueStatusBadgeProps {
  status: IssueStatus;
  isOverdue?: boolean;
  className?: string;
}

export function IssueStatusBadge({
  status,
  isOverdue,
  className,
}: IssueStatusBadgeProps) {
  if (isOverdue) {
    return (
      <Badge variant='destructive' className={className}>
        Overdue
      </Badge>
    );
  }

  return (
    <Badge variant={VARIANT[status]} className={className}>
      {LABEL[status]}
    </Badge>
  );
}
