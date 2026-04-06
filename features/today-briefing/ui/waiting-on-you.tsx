import type { WaitingTask } from '../model/types';

interface WaitingOnYouProps {
  tasks: WaitingTask[];
}

export function WaitingOnYou({ tasks }: WaitingOnYouProps) {
  if (tasks.length === 0) return null;

  return (
    <div className='flex flex-col gap-2'>
      <span className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
        Waiting on you
      </span>

      <div className='flex flex-col gap-2'>
        {tasks.slice(0, 5).map((task) => {
          const isUrgent = task.age_days > 7;
          return (
            <div
              key={task.id}
              className='flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3'
            >
              <div
                className={`h-2 w-2 shrink-0 rounded-full ${isUrgent ? 'bg-red-500' : 'bg-blue-500'}`}
              />
              <div className='min-w-0 flex-1'>
                <p className='text-sm font-medium text-foreground truncate'>
                  {task.name}
                </p>
                {task.source_meeting_title && (
                  <p className='text-xs text-muted-foreground truncate'>
                    {task.source_meeting_title}
                    {task.description && ` — ${task.description}`}
                  </p>
                )}
              </div>
              <span
                className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${isUrgent ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}
              >
                {task.age_days}d
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
