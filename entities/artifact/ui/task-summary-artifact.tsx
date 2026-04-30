import { AlertCircle, CheckCircle2, ListChecks, Loader2 } from 'lucide-react';

import { DeltaBadge } from '@/shared/ui/stats/delta-badge';

import type { TaskSummaryArtifact } from '@/entities/artifact/model/types';

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconClassName: string;
  delta?: number;
  deltaLabel?: string;
  deltaPolarity?: 'positive-good' | 'negative-good';
}

function StatCard({
  label,
  value,
  icon,
  iconClassName,
  delta,
  deltaLabel,
  deltaPolarity = 'positive-good',
}: StatCardProps) {
  return (
    <div className='flex flex-col gap-2 rounded-[var(--radius-card)] border border-border bg-card p-4'>
      <div className='flex items-center justify-between'>
        <span className='text-xs font-medium text-muted-foreground'>{label}</span>
        <div className={`flex h-7 w-7 items-center justify-center rounded-md ${iconClassName}`}>
          {icon}
        </div>
      </div>
      <p className='text-2xl font-bold text-foreground tabular-nums'>{value}</p>
      {delta !== undefined && deltaLabel !== undefined && (
        <DeltaBadge delta={delta} label={deltaLabel} polarity={deltaPolarity} />
      )}
    </div>
  );
}

export function TaskSummaryArtifactView({ data }: { data: TaskSummaryArtifact['data'] }) {
  const periodLabel = data.period_label ?? 'This week';

  const cards: StatCardProps[] = [
    {
      label: 'Total',
      value: data.total,
      icon: <ListChecks className='h-3.5 w-3.5' />,
      iconClassName: 'bg-primary/10 text-primary',
    },
    {
      label: 'In Progress',
      value: data.in_progress,
      icon: <Loader2 className='h-3.5 w-3.5' />,
      iconClassName: 'bg-yellow-500/15 text-yellow-300',
    },
    {
      label: 'Completed',
      value: data.completed,
      icon: <CheckCircle2 className='h-3.5 w-3.5' />,
      iconClassName: 'bg-accent/15 text-emerald-400',
      delta: data.delta_week,
      deltaLabel: 'vs last week',
    },
    {
      label: 'Overdue',
      value: data.overdue,
      icon: <AlertCircle className='h-3.5 w-3.5' />,
      iconClassName: 'bg-destructive/10 text-red-400',
      delta: data.delta_today ?? undefined,
      deltaLabel: 'vs yesterday',
      deltaPolarity: 'negative-good',
    },
  ];

  return (
    <div className='space-y-2'>
      <p className='text-xs text-muted-foreground'>{periodLabel}</p>
      <div className='grid grid-cols-2 gap-2'>
        {cards.map((card) => {
          return <StatCard key={card.label} {...card} />;
        })}
      </div>
    </div>
  );
}
