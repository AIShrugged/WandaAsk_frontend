import { getIssueStats, getIssueStatsHistory } from '@/features/issues';
import { IssueProgressPage } from '@/features/issues/ui/issue-progress-page';

import type { IssueHistoryPeriod } from '@/features/issues';

const VALID_PERIODS = new Set<IssueHistoryPeriod>(['day', 'week', 'month']);

export default async function TodayProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: rawPeriod } = await searchParams;
  const period: IssueHistoryPeriod = VALID_PERIODS.has(
    rawPeriod as IssueHistoryPeriod,
  )
    ? (rawPeriod as IssueHistoryPeriod)
    : 'week';

  const [stats, history] = await Promise.all([
    getIssueStats(),
    getIssueStatsHistory(period),
  ]);

  return <IssueProgressPage stats={stats} history={history} period={period} />;
}
