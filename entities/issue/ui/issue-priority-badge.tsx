import { getPriorityLevel } from '../model/types';

import type { IssueStatus } from '../model/types';

interface IssuePriorityBadgeProps {
  priority: number;
  status?: IssueStatus;
  className?: string;
}

export function IssuePriorityBadge({
  priority,
  status,
  className = '',
}: IssuePriorityBadgeProps) {
  if (priority === 0) return null;
  if (status === 'done') return null;
  const level = getPriorityLevel(priority);
  return (
    <span className={`text-xs font-medium ${level.color} ${className}`}>
      ● {level.label}
    </span>
  );
}
