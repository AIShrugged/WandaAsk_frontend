import { getPriorityLevel } from '../model/types';

interface IssuePriorityBadgeProps {
  priority: number;
  className?: string;
}

export function IssuePriorityBadge({
  priority,
  className = '',
}: IssuePriorityBadgeProps) {
  if (priority === 0) return null;
  const level = getPriorityLevel(priority);
  return (
    <span className={`text-xs font-medium ${level.color} ${className}`}>
      ● {level.label}
    </span>
  );
}
