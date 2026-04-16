import { AlertCircle, CheckCircle2, ListChecks, Loader2 } from 'lucide-react';

import { computeTaskStats } from '../model/task-stats';

import type { TodayBriefing } from '../model/types';
import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: number;
  icon: ReactNode;
  iconClassName: string;
}

function StatCard({ label, value, icon, iconClassName }: StatCardProps) {
  return (
    <div className='flex flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-card'>
      <div className='flex items-center justify-between'>
        <span className='text-sm font-medium text-muted-foreground'>
          {label}
        </span>
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-md ${iconClassName}`}
        >
          {icon}
        </div>
      </div>
      <p className='text-3xl font-bold text-foreground tabular-nums'>{value}</p>
    </div>
  );
}

interface StatCardConfig {
  label: string;
  key: keyof ReturnType<typeof computeTaskStats>;
  icon: ReactNode;
  iconClassName: string;
}

const STAT_CARDS: StatCardConfig[] = [
  {
    label: 'Total Active',
    key: 'totalActive',
    icon: <ListChecks className='h-4 w-4' />,
    iconClassName: 'bg-primary/10 text-primary',
  },
  {
    label: 'In Progress',
    key: 'inProgress',
    icon: <Loader2 className='h-4 w-4' />,
    iconClassName: 'bg-yellow-500/15 text-yellow-300',
  },
  {
    label: 'Completed',
    key: 'completed',
    icon: <CheckCircle2 className='h-4 w-4' />,
    iconClassName: 'bg-accent/15 text-emerald-400',
  },
  {
    label: 'Overdue',
    key: 'overdue',
    icon: <AlertCircle className='h-4 w-4' />,
    iconClassName: 'bg-destructive/10 text-red-400',
  },
];

interface TaskStatsBlockProps {
  data: TodayBriefing;
}

export function TaskStatsBlock({ data }: TaskStatsBlockProps) {
  const stats = computeTaskStats(data);

  return (
    <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
      {STAT_CARDS.map(({ label, key, icon, iconClassName }) => {
        return (
          <StatCard
            key={key}
            label={label}
            value={stats[key]}
            icon={icon}
            iconClassName={iconClassName}
          />
        );
      })}
    </div>
  );
}
