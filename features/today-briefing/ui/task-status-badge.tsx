import { Badge } from '@/shared/ui/badge';

import type { TaskStatus } from '../model/types';

const VARIANT: Record<
  TaskStatus,
  React.ComponentProps<typeof Badge>['variant']
> = {
  open: 'warning',
  in_progress: 'primary',
  paused: 'default',
  review: 'primary',
  reopen: 'destructive',
  done: 'success',
};

const LABEL: Record<TaskStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  paused: 'Paused',
  review: 'Review',
  reopen: 'Reopened',
  done: 'Done',
};

interface TaskStatusBadgeProps {
  status: TaskStatus;
  isOverdue?: boolean;
  className?: string;
}

/**
 * TaskStatusBadge — canonical status badge for today-briefing tasks.
 * Supports an overdue override: when isOverdue is true, renders as destructive 'Overdue'.
 * @param props - Component props.
 * @param props.status - Task status value.
 * @param props.isOverdue - When true, overrides status display with 'Overdue'.
 * @param props.className - Optional additional class names.
 */
export function TaskStatusBadge({
  status,
  isOverdue,
  className,
}: TaskStatusBadgeProps) {
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
