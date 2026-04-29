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
}: {
  stats: IssueStats;
  history: IssueStatsHistory;
  period: IssueHistoryPeriod;
}) {
  return (
    <div className='space-y-6 p-6'>
      <IssueProgressKpiCards stats={stats} />
      <div className='grid gap-6 lg:grid-cols-2'>
        <IssueProgressChart history={history} period={period} />
        <IssueWeeklySummary stats={stats} />
      </div>
    </div>
  );
}
