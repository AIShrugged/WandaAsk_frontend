import { CheckCircle2, CircleDot, Clock, XCircle } from 'lucide-react';

import { Badge } from '@/shared/ui/badge';

import type { MeetingTaskStatus } from '../model/types';

const CONFIG: Record<
  MeetingTaskStatus,
  {
    variant: React.ComponentProps<typeof Badge>['variant'];
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
  }
> = {
  open: { variant: 'warning', label: 'Open', Icon: Clock },
  in_progress: { variant: 'primary', label: 'In Progress', Icon: CircleDot },
  done: { variant: 'success', label: 'Done', Icon: CheckCircle2 },
  cancelled: { variant: 'destructive', label: 'Cancelled', Icon: XCircle },
};

interface MeetingTaskStatusBadgeProps {
  status: MeetingTaskStatus;
  className?: string;
}

/**
 * MeetingTaskStatusBadge — canonical status badge for meeting tasks.
 * Includes an icon alongside the label using the Badge component.
 * @param props - Component props.
 * @param props.status - Meeting task status value.
 * @param props.className - Optional additional class names.
 */
export function MeetingTaskStatusBadge({
  status,
  className,
}: MeetingTaskStatusBadgeProps) {
  const { variant, label, Icon } = CONFIG[status];

  return (
    <Badge variant={variant} className={className}>
      <Icon className='mr-1 h-3 w-3' />
      {label}
    </Badge>
  );
}
