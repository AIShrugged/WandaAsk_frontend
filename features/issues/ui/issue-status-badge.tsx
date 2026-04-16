import { Badge } from '@/shared/ui/badge';

import type { IssueStatus } from '../model/types';

// Extended to cover the `review` and `reopen` values used in features/teams
export type ExtendedIssueStatus = IssueStatus | 'review' | 'reopen';

const VARIANT: Record<
  ExtendedIssueStatus,
  React.ComponentProps<typeof Badge>['variant']
> = {
  open: 'warning',
  in_progress: 'primary',
  paused: 'default',
  done: 'success',
  review: 'primary',
  reopen: 'destructive',
};

const LABEL: Record<ExtendedIssueStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  paused: 'Paused',
  done: 'Done',
  review: 'Review',
  reopen: 'Reopened',
};

interface IssueStatusBadgeProps {
  status: ExtendedIssueStatus;
  className?: string;
}

/**
 * IssueStatusBadge — canonical status badge for issues and tasks.
 * Owns the authoritative color mapping for all issue/task statuses.
 * @param props - Component props.
 * @param props.status - Issue or task status value.
 * @param props.className - Optional additional class names.
 */
export function IssueStatusBadge({ status, className }: IssueStatusBadgeProps) {
  return (
    <Badge variant={VARIANT[status]} className={className}>
      {LABEL[status]}
    </Badge>
  );
}
