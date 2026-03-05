import { format, isValid, parseISO } from 'date-fns';

import type { TaskTableArtifact } from '@/features/chat/types';

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
  closed: 'bg-muted text-muted-foreground',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In progress',
  done: 'Done',
  closed: 'Closed',
};

/**
 * formatDueDate.
 * @param value - value.
 * @returns Result.
 */
function formatDueDate(value: string | null): string {
  if (!value) return '—';
  try {
    const date = parseISO(value);

    if (isValid(date)) return format(date, 'MMM d, yyyy');
  } catch {
    /* keep raw */
  }

  return value;
}

/**
 * TaskTable component.
 * @param props - Component props.
 * @param props.data
 */
export function TaskTable({ data }: { data: TaskTableArtifact['data'] }) {
  const tasks = data.tasks ?? [];

  if (tasks.length === 0) {
    return (
      <p className='text-sm text-muted-foreground text-center py-6'>
        No tasks yet
      </p>
    );
  }

  return (
    <div className='flex flex-col gap-2'>
      {tasks.map((task, i) => {
        return (
          <div
            key={i}
            className='flex flex-col gap-1 p-3 rounded-[var(--radius-button)] bg-accent/30 hover:bg-accent/50 transition-colors'
          >
            <div className='flex items-start justify-between gap-2'>
              <p className='text-sm font-medium text-foreground leading-snug flex-1'>
                {task.title}
              </p>
              <span
                className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[task.status] ?? 'bg-muted text-muted-foreground'}`}
              >
                {STATUS_LABELS[task.status] ?? task.status}
              </span>
            </div>
            {task.description && (
              <p className='text-xs text-muted-foreground leading-relaxed line-clamp-2'>
                {task.description}
              </p>
            )}
            <div className='flex items-center gap-3 mt-0.5 text-xs text-muted-foreground'>
              {task.assignee_name && <span>{task.assignee_name}</span>}
              {task.due_date && <span>{formatDueDate(task.due_date)}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
