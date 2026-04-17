import { AlertCircle, CheckCheck } from 'lucide-react';

export function CarriedTasks({ count }: { count: number }) {
  if (count === 0) return null;

  const isHigh = count >= 10;
  const colorClass = isHigh ? 'text-red-400' : 'text-emerald-400';
  const Icon = isHigh ? AlertCircle : CheckCheck;

  return (
    <span className={`flex items-center gap-1.5 text-md ${colorClass}`}>
      <Icon className='h-3.5 w-3.5 shrink-0' />
      {count} open {count === 1 ? 'task' : 'tasks'} carried from previous syncs
    </span>
  );
}
