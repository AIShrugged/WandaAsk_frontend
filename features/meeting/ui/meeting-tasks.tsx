import { format } from 'date-fns';

import { MeetingTaskStatusBadge } from '@/features/meeting/ui/meeting-task-status-badge';
import { MarkdownContent } from '@/shared/ui/markdown-content';

import type { MeetingTask } from '@/features/meeting/types';

/**
 *
 * @param root0
 * @param root0.task
 */
function TaskRow({ task }: { task: MeetingTask }) {
  return (
    <div className='flex flex-col gap-1.5 py-4 border-b border-border last:border-0'>
      <div className='flex items-start justify-between gap-3'>
        <p className='text-sm font-medium text-foreground leading-snug'>
          {task.title}
        </p>
        <MeetingTaskStatusBadge status={task.status} />
      </div>

      {task.description && (
        <p className='text-xs text-muted-foreground leading-relaxed'>
          <MarkdownContent>{task.description}</MarkdownContent>
        </p>
      )}

      <div className='flex items-center gap-4 text-xs text-muted-foreground'>
        {task.assignee_name && <span>Assignee: {task.assignee_name}</span>}
        {task.due_date &&
          (() => {
            const d = new Date(task.due_date);

            return Number.isNaN(d.getTime()) ? null : (
              <span>Due: {format(d, 'dd MMM yyyy')}</span>
            );
          })()}
      </div>
    </div>
  );
}

interface MeetingTasksProps {
  tasks: MeetingTask[];
}

/**
 * MeetingTasks — displays the list of AI-extracted tasks for a meeting.
 * @param props - Component props.
 * @param props.tasks - Array of meeting tasks.
 * @returns JSX element.
 */
export default function MeetingTasks({ tasks }: MeetingTasksProps) {
  if (tasks.length === 0) {
    return (
      <div className='py-12 text-center text-sm text-muted-foreground'>
        No tasks found for this meeting.
      </div>
    );
  }

  return (
    <div className='flex flex-col'>
      <div className='flex items-center justify-between mb-2'>
        <p className='text-xs text-muted-foreground'>
          {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
        </p>
      </div>

      <div>
        {tasks.map((task) => {
          return <TaskRow key={task.id} task={task} />;
        })}
      </div>
    </div>
  );
}
