import {
  AlertCircle,
  CheckCircle2,
  ListChecks,
  Loader2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

import { getIssueStats } from '../api/task-stats';

import type { ReactNode } from 'react';

interface DeltaBadgeProps {
  delta: number;
  label: string;
}

function DeltaBadge({ delta, label }: DeltaBadgeProps) {
  if (delta === 0) {
    return (
      <span className='text-xs text-muted-foreground'>No change {label}</span>
    );
  }

  const positive = delta > 0;

  return (
    <span
      className={`flex items-center gap-1 text-xs font-medium ${positive ? 'text-emerald-400' : 'text-red-400'}`}
    >
      {positive ? (
        <TrendingUp className='h-3 w-3' />
      ) : (
        <TrendingDown className='h-3 w-3' />
      )}
      {positive ? '+' : ''}
      {delta} {label}
    </span>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: ReactNode;
  iconClassName: string;
  delta?: number;
  deltaLabel?: string;
}

function StatCard({
  label,
  value,
  icon,
  iconClassName,
  delta,
  deltaLabel,
}: StatCardProps) {
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
      {delta !== undefined && (
        <DeltaBadge delta={delta} label={deltaLabel ?? ''} />
      )}
    </div>
  );
}

export async function TaskStatsBlock() {
  const stats = await getIssueStats();

  const items = [
    {
      label: 'Total',
      value: stats.total,
      icon: ListChecks,
      iconClassName: 'bg-primary/10 text-primary',
      delta: 0,
      deltaLabel: 'active tasks',
    },
    {
      label: 'In Progress',
      value: stats.in_progress,
      icon: Loader2,
      iconClassName: 'bg-yellow-500/15 text-yellow-300',
      delta: stats.delta.in_progress,
      deltaLabel: 'vs yesterday',
    },
    {
      label: 'Completed',
      value: stats.completed,
      icon: CheckCircle2,
      iconClassName: 'bg-accent/15 text-emerald-400',
      delta: stats.delta.completed,
      deltaLabel: 'vs yesterday',
    },
    {
      label: 'Overdue',
      value: stats.overdue,
      icon: AlertCircle,
      iconClassName: 'bg-destructive/10 text-red-400',
      delta: stats.delta.overdue,
      deltaLabel: 'vs yesterday',
    },
  ];

  return (
    <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <StatCard
            key={item.label}
            label={item.label}
            value={item.value}
            icon={<Icon className='h-4 w-4' />}
            iconClassName={item.iconClassName}
            delta={item.delta}
            deltaLabel={item.deltaLabel}
          />
        );
      })}
    </div>
  );
}
