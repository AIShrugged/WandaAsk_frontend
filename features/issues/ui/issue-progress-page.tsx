import { Info } from 'lucide-react';

import { IssueProgressChart } from './issue-progress-chart';
import { IssueProgressKpiCards } from './issue-progress-kpi-cards';
import { IssueWeeklySummary } from './issue-weekly-summary';

import type {
  IssueHistoryPeriod,
  IssueStats,
  IssueStatsHistory,
} from '../model/types';

export function IssueProgressPage({
  stats,
  history,
  period,
  hasActiveFilters,
}: {
  stats: IssueStats;
  history: IssueStatsHistory;
  period: IssueHistoryPeriod;
  hasActiveFilters?: boolean;
}) {
  return (
    <div className='space-y-6 p-6'>
      {hasActiveFilters && (
        <div className='flex items-start gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-300'>
          <Info className='mt-0.5 size-4 shrink-0' />
          <span>
            Progress stats reflect organization-wide data and are not filtered
            by assignee or team.
          </span>
        </div>
      )}
      <IssueProgressKpiCards stats={stats} />
      <div className='grid gap-6 lg:grid-cols-2'>
        <IssueProgressChart history={history} period={period} />
        <IssueWeeklySummary stats={stats} />
      </div>
    </div>
  );
}
