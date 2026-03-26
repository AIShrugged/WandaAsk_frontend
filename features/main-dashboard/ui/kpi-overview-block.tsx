import {
  Video,
  Users,
  CheckSquare,
  ListChecks,
  FileText,
  Clock,
} from 'lucide-react';
import Link from 'next/link';

import { ROUTES } from '@/shared/lib/routes';

import type { DashboardApiResponse } from '@/features/summary/types';

interface KpiTileProps {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ReactNode;
  href?: string;
  accent?: boolean;
}

/**
 * KpiTile — compact stat tile for the overview row.
 * @param root0
 * @param root0.label
 * @param root0.value
 * @param root0.sub
 * @param root0.icon
 * @param root0.href
 * @param root0.accent
 */
function KpiTile({ label, value, sub, icon, href, accent }: KpiTileProps) {
  const inner = (
    <div className='flex flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-card h-full hover:border-primary/30 transition-colors'>
      <div className='flex items-center justify-between'>
        <span className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
          {label}
        </span>
        <div className='flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary'>
          {icon}
        </div>
      </div>
      <p
        className={
          accent
            ? 'text-3xl font-bold text-primary tabular-nums'
            : 'text-3xl font-bold text-foreground tabular-nums'
        }
      >
        {value}
      </p>
      {sub && <p className='text-xs text-muted-foreground'>{sub}</p>}
    </div>
  );

  if (href) {
    return <Link href={href}>{inner}</Link>;
  }

  return inner;
}

interface KpiOverviewBlockProps {
  summary: DashboardApiResponse;
}

/**
 * KpiOverviewBlock — row of key performance indicators from summary data.
 * @param root0
 * @param root0.summary
 */
export function KpiOverviewBlock({ summary }: KpiOverviewBlockProps) {
  const totalHours = Math.round(summary.meetings.total_duration_minutes / 60);
  const openTasks =
    summary.tasks.by_status.open + summary.tasks.by_status.in_progress;

  return (
    <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6'>
      <KpiTile
        label='Meetings'
        value={summary.meetings.total}
        sub={`Avg ${summary.meetings.average_duration_minutes} min`}
        icon={<Video className='h-3.5 w-3.5' />}
        href={ROUTES.DASHBOARD.SUMMARY}
        accent
      />
      <KpiTile
        label='Total time'
        value={`${totalHours}h`}
        sub='Meeting hours'
        icon={<Clock className='h-3.5 w-3.5' />}
      />
      <KpiTile
        label='Participants'
        value={summary.participants.total_unique}
        sub={`Avg ${summary.participants.average_per_meeting} / meeting`}
        icon={<Users className='h-3.5 w-3.5' />}
      />
      <KpiTile
        label='Active tasks'
        value={openTasks}
        sub={
          summary.tasks.overdue > 0
            ? `${summary.tasks.overdue} overdue`
            : `${summary.tasks.total} total`
        }
        icon={<CheckSquare className='h-3.5 w-3.5' />}
        href={ROUTES.DASHBOARD.SUMMARY}
      />
      <KpiTile
        label='Follow-ups'
        value={summary.followups.total}
        sub={`${summary.followups.by_status.done} done`}
        icon={<ListChecks className='h-3.5 w-3.5' />}
        href={ROUTES.DASHBOARD.FOLLOWUPS}
      />
      <KpiTile
        label='Summaries'
        value={summary.summaries.total}
        sub='AI-generated'
        icon={<FileText className='h-3.5 w-3.5' />}
      />
    </div>
  );
}
