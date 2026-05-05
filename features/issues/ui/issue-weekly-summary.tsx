import {
  AlertCircle,
  CheckCircle2,
  ListChecks,
  Loader2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

import type { IssueStats } from '../model/types';

interface WeeklyMetricRowProps {
  label: string;
  value: number;
  delta: number;
  icon: React.ReactNode;
  iconClassName: string;
  polarity?: 'positive-good' | 'negative-good';
}

function WeeklyMetricRow({
  label,
  value,
  delta,
  icon,
  iconClassName,
  polarity = 'positive-good',
}: WeeklyMetricRowProps) {
  const isGood = polarity === 'positive-good' ? delta > 0 : delta < 0;
  const showDelta = delta !== 0;

  return (
    <div className='flex items-center justify-between py-2'>
      <div className='flex items-center gap-3'>
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-md ${iconClassName}`}
        >
          {icon}
        </div>
        <span className='text-sm font-medium text-foreground'>{label}</span>
      </div>
      <div className='flex items-center gap-3'>
        {showDelta && (
          <span
            className={`flex items-center gap-1 text-xs font-medium ${isGood ? 'text-emerald-400' : 'text-red-400'}`}
          >
            {delta > 0 ? (
              <TrendingUp className='h-3 w-3' />
            ) : (
              <TrendingDown className='h-3 w-3' />
            )}
            {delta > 0 ? '+' : ''}
            {delta} vs last week
          </span>
        )}
        {!showDelta && (
          <span className='text-xs text-muted-foreground'>No change</span>
        )}
        <span className='w-10 text-right text-lg font-bold tabular-nums text-foreground'>
          {value}
        </span>
      </div>
    </div>
  );
}

function overdueFeedback(stats: IssueStats): string | null {
  if (stats.overdue === 0) return null;
  if (stats.delta.overdue > 0) {
    return `Overdue tasks increased by ${stats.delta.overdue} since yesterday — consider reassigning or breaking them down.`;
  }
  if (stats.delta.overdue < 0) {
    return `Good progress — overdue tasks dropped by ${Math.abs(stats.delta.overdue)} since yesterday.`;
  }
  const noun = stats.overdue === 1 ? 'task' : 'tasks';
  return `${stats.overdue} overdue ${noun} remain unchanged — prioritize clearing them this week.`;
}

function weeklyClosedFeedback(stats: IssueStats): string | null {
  const noun = Math.abs(stats.delta_week) === 1 ? 'task' : 'tasks';
  if (stats.delta_week > 0) {
    return `You closed ${stats.delta_week} more ${noun} than last week — solid momentum, keep it up.`;
  }
  if (stats.delta_week < 0) {
    return `Closed tasks dropped by ${Math.abs(stats.delta_week)} vs last week — check if blockers are slowing the team.`;
  }
  if (stats.closed_this_week > 0) {
    return `Weekly closed count matches last week — consistent delivery.`;
  }
  return null;
}

function generateFeedback(stats: IssueStats): string[] {
  const items = [
    overdueFeedback(stats),
    weeklyClosedFeedback(stats),
    stats.in_progress > 8
      ? `${stats.in_progress} tasks in progress simultaneously — consider limiting WIP to improve flow.`
      : null,
  ].filter((item): item is string => {
    return item !== null;
  });

  return items.length > 0
    ? items
    : ['All metrics look stable. Keep the current pace going.'];
}

export function IssueWeeklySummary({ stats }: { stats: IssueStats }) {
  const feedback = generateFeedback(stats);

  return (
    <div className='space-y-4'>
      <div className='rounded-[var(--radius-card)] border border-border bg-card p-5'>
        <h3 className='mb-1 text-sm font-semibold text-foreground'>
          Current Status
        </h3>
        <p className='mb-4 text-xs text-muted-foreground'>
          Live snapshot with week-over-week comparison
        </p>
        <div className='divide-y divide-border'>
          <WeeklyMetricRow
            label='Total'
            value={stats.total}
            delta={0}
            icon={<ListChecks className='h-3.5 w-3.5' />}
            iconClassName='bg-primary/10 text-primary'
          />
          <WeeklyMetricRow
            label='In Progress'
            value={stats.in_progress}
            delta={stats.delta.in_progress}
            icon={<Loader2 className='h-3.5 w-3.5' />}
            iconClassName='bg-yellow-500/15 text-yellow-300'
          />
          <WeeklyMetricRow
            label='Completed'
            value={stats.completed}
            delta={stats.delta.completed}
            icon={<CheckCircle2 className='h-3.5 w-3.5' />}
            iconClassName='bg-accent/15 text-emerald-400'
          />
          <WeeklyMetricRow
            label='Overdue'
            value={stats.overdue}
            delta={stats.delta.overdue}
            icon={<AlertCircle className='h-3.5 w-3.5' />}
            iconClassName='bg-destructive/10 text-red-400'
            polarity='negative-good'
          />
        </div>
      </div>

      <div className='rounded-[var(--radius-card)] border border-border bg-card p-5'>
        <h3 className='mb-1 text-sm font-semibold text-foreground'>
          Performance Feedback
        </h3>
        <p className='mb-4 text-xs text-muted-foreground'>
          Based on your weekly task dynamics
        </p>
        <ul className='space-y-2'>
          {feedback.map((item, i) => {
            return (
              <li key={i} className='flex gap-2 text-sm text-muted-foreground'>
                <span className='mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary' />
                {item}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
