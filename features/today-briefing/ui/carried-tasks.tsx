import Link from 'next/link';

import { ROUTES } from '@/shared/lib/routes';
import { Badge } from '@/shared/ui/badge';

import type { CarriedTask } from '../model/types';

const MAX_SHOWN = 5;

interface CarriedTasksProps {
  tasks: CarriedTask[];
}

export function CarriedTasks({ tasks }: CarriedTasksProps) {
  if (tasks.length === 0) return null;

  const visible = tasks.slice(0, MAX_SHOWN);
  const remaining = tasks.length - MAX_SHOWN;

  return (
    <div className='flex flex-col gap-1'>
      <span className='text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2'>
        Carried from previous syncs
      </span>

      {visible.map((task) => {
        return (
          <div
            key={task.id}
            className='flex items-center gap-2 rounded-md px-2 py-1.5 text-sm'
          >
            <span className='text-xs text-muted-foreground shrink-0 w-16'>
              {task.syncs_since_created === 1
                ? 'Yesterday'
                : `${task.syncs_since_created} syncs`}
            </span>
            <span className='flex-1 truncate text-foreground'>
              {task.assignee_name && (
                <span className='text-muted-foreground'>
                  {task.assignee_name}:{' '}
                </span>
              )}
              <Link
                href={`${ROUTES.DASHBOARD.ISSUES}/${task.id}`}
                className='hover:text-primary hover:underline transition-colors'
              >
                {task.name}
              </Link>
            </span>
            <Badge
              variant={task.status === 'open' ? 'default' : 'primary'}
              className='shrink-0 text-[10px]'
            >
              {task.status === 'open' ? 'Open' : 'In progress'}
            </Badge>
          </div>
        );
      })}

      {remaining > 0 && (
        <Link
          href={ROUTES.DASHBOARD.ISSUES}
          className='mt-1 text-xs text-primary hover:underline px-2'
        >
          +{remaining} more in task tracker
        </Link>
      )}
    </div>
  );
}
