import { format, parseISO } from 'date-fns';
import Link from 'next/link';

import { ROUTES } from '@/shared/lib/routes';
import { Badge } from '@/shared/ui/badge/Badge';

import type {
  DashboardTaskCard,
  IssueStatus,
} from '../../model/dashboard-types';

const STATUS_VARIANT: Record<
  IssueStatus,
  'default' | 'success' | 'warning' | 'destructive' | 'primary'
> = {
  done: 'success',
  open: 'default',
  in_progress: 'warning',
  paused: 'destructive',
  review: 'primary',
  reopen: 'destructive',
};

const STATUS_LABEL: Record<IssueStatus, string> = {
  done: 'Done',
  open: 'Open',
  in_progress: 'In Progress',
  paused: 'Paused',
  review: 'Review',
  reopen: 'Reopen',
};

const PRIORITY_DOT: Record<string, string> = {
  high: 'bg-red-400',
  medium: 'bg-yellow-300',
};

interface TeamDashboardTaskRowProps {
  task: DashboardTaskCard;
}

/**
 * TeamDashboardTaskRow — renders a single task card row.
 * @param props - Component props.
 * @param props.task
 */
export default function TeamDashboardTaskRow({
  task,
}: TeamDashboardTaskRowProps) {
  const dotColor = task.priority ? PRIORITY_DOT[task.priority] : null;

  return (
    <div className='flex items-start gap-3 py-3 border-b border-border/50 last:border-0'>
      {/* Priority dot */}
      <div className='mt-1 flex-shrink-0 w-2 h-2 rounded-full'>
        {dotColor && (
          <span className={`block w-2 h-2 rounded-full ${dotColor}`} />
        )}
      </div>

      {/* Content */}
      <div className='flex-1 min-w-0'>
        <div className='flex items-center gap-2 flex-wrap'>
          <Link
            href={`${ROUTES.DASHBOARD.ISSUES}/${task.id}`}
            className='text-sm font-medium text-foreground truncate hover:text-primary transition-colors'
          >
            {task.title}
          </Link>
          <Badge variant={STATUS_VARIANT[task.status]}>
            {STATUS_LABEL[task.status]}
          </Badge>
        </div>

        <div className='flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap'>
          {task.assignee && <span>{task.assignee.name}</span>}
          {task.due_date && (
            <span>{format(parseISO(task.due_date), 'MMM d')}</span>
          )}
          {task.meeting && (
            <Link
              href={`${ROUTES.DASHBOARD.MEETINGS}/${task.meeting.id}`}
              className='hover:text-foreground transition-colors truncate max-w-[160px]'
            >
              {task.meeting.title}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
