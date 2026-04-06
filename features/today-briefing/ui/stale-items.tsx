import type { StaleTask } from '../model/types';

interface StaleItemsProps {
  tasks: StaleTask[];
}

export function StaleItems({ tasks }: StaleItemsProps) {
  if (tasks.length === 0) return null;

  return (
    <div className='flex flex-col gap-2'>
      <span className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
        Stale — no progress across meetings
      </span>

      <div className='flex flex-col gap-2'>
        {tasks.slice(0, 5).map((task) => (
          <div
            key={task.id}
            className='flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3'
          >
            <div className='h-2 w-2 shrink-0 rounded-full bg-orange-500' />
            <div className='min-w-0 flex-1'>
              <p className='text-sm font-medium text-foreground truncate'>
                {task.name}
                {task.assignee_name && (
                  <span className='text-muted-foreground'>
                    {' '}
                    — {task.assignee_name}
                  </span>
                )}
              </p>
              {task.description && (
                <p className='text-xs text-muted-foreground truncate'>
                  {task.description}
                </p>
              )}
            </div>
            <span className='shrink-0 rounded-md bg-orange-500/10 px-2 py-0.5 text-xs font-medium text-orange-500'>
              {task.syncs_since_created} meetings
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
