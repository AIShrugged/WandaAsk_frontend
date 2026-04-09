import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { ROUTES } from '@/shared/lib/routes';

interface CarriedTasksProps {
  count: number;
}

export function CarriedTasks({ count }: CarriedTasksProps) {
  if (count === 0) return null;

  return (
    <Link
      href={`${ROUTES.DASHBOARD.ISSUES_LIST}?status=open`}
      className='flex items-center gap-1.5 text-xs text-primary hover:underline'
    >
      <ArrowRight className='h-3.5 w-3.5 shrink-0' />
      {count} open {count === 1 ? 'task' : 'tasks'} carried from previous syncs
    </Link>
  );
}
