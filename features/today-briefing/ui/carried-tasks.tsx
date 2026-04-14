import { ArrowRight } from 'lucide-react';

interface CarriedTasksProps {
  count: number;
}

export function CarriedTasks({ count }: CarriedTasksProps) {
  if (count === 0) return null;

  return (
    <span className='flex items-center gap-1.5 text-xs text-muted-foreground'>
      <ArrowRight className='h-3.5 w-3.5 shrink-0' />
      {count} open {count === 1 ? 'task' : 'tasks'} carried from previous syncs
    </span>
  );
}
