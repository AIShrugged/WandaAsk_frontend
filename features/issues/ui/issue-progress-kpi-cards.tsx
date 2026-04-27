import { Award, Calendar, CalendarDays, CheckCircle2 } from 'lucide-react';

import { DeltaBadge } from '@/shared/ui/stats/delta-badge';

import type { IssueStats } from '../model/types';

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconClassName: string;
  delta?: React.ReactNode;
}

function StatCard({ label, value, icon, iconClassName, delta }: StatCardProps) {
  return (
    <div className='flex flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-card p-5'>
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
      {delta}
    </div>
  );
}

export function IssueProgressKpiCards({ stats }: { stats: IssueStats }) {
  return (
    <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
      <StatCard
        label='Closed Today'
        value={stats.closed_today}
        icon={<CheckCircle2 className='h-4 w-4' />}
        iconClassName='bg-accent/15 text-emerald-400'
        delta={<DeltaBadge delta={stats.delta_today} label='vs yesterday' />}
      />
      <StatCard
        label='Closed This Week'
        value={stats.closed_this_week}
        icon={<CalendarDays className='h-4 w-4' />}
        iconClassName='bg-primary/10 text-primary'
        delta={<DeltaBadge delta={stats.delta_week} label='vs last week' />}
      />
      <StatCard
        label='Closed This Month'
        value={stats.closed_this_month}
        icon={<Calendar className='h-4 w-4' />}
        iconClassName='bg-violet-500/10 text-violet-400'
        delta={<DeltaBadge delta={stats.delta_month} label='vs last month' />}
      />
      <StatCard
        label='All Time'
        value={stats.closed_all_time}
        icon={<Award className='h-4 w-4' />}
        iconClassName='bg-yellow-500/10 text-yellow-400'
      />
    </div>
  );
}
