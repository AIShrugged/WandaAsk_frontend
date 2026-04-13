import type { TeamDashboardKpis } from '../../model/dashboard-types';

interface TeamDashboardKpisProps {
  kpis: TeamDashboardKpis;
}

/**
 * TeamDashboardKpis — 3-column KPI stat row.
 * @param props - Component props.
 * @param props.kpis
 */
export default function TeamDashboardKpis({ kpis }: TeamDashboardKpisProps) {
  const completionColor =
    kpis.meetings.completion_rate >= 80
      ? 'text-emerald-400'
      : 'text-yellow-300';

  console.log(kpis.action_items);

  return (
    <div className='grid grid-cols-3 gap-4'>
      {/* Action Items */}
      <div className='rounded-[var(--radius-card)] border border-border bg-card p-4'>
        <p className='text-xs text-muted-foreground mb-1'>Action Items</p>
        <p className='text-3xl font-bold text-foreground'>
          {kpis.action_items.total}
        </p>
        <div className='flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap'>
          <span>{kpis.action_items.done} done</span>
          <span>{kpis.action_items.in_progress} in progress</span>
          {kpis.action_items.overdue > 0 && (
            <span className='text-red-400'>
              {kpis.action_items.overdue} overdue
            </span>
          )}
        </div>
      </div>

      {/* Meetings */}
      <div className='rounded-[var(--radius-card)] border border-border bg-card p-4'>
        <p className='text-xs text-muted-foreground mb-1'>Meetings</p>
        <p className='text-3xl font-bold text-foreground'>
          {kpis.meetings.total}
        </p>
        <div className='flex items-center gap-3 mt-2 text-xs flex-wrap'>
          <span className={completionColor}>
            {kpis.meetings.completion_rate.toFixed(0)}% completion
          </span>
          <span className='text-muted-foreground'>
            {kpis.meetings.with_summary} summaries
          </span>
        </div>
      </div>

      {/* People */}
      <div className='rounded-[var(--radius-card)] border border-border bg-card p-4'>
        <p className='text-xs text-muted-foreground mb-1'>People</p>
        <p className='text-3xl font-bold text-foreground'>
          {kpis.people.total}
        </p>
        <p className='mt-2 text-xs text-muted-foreground'>team members</p>
      </div>
    </div>
  );
}
