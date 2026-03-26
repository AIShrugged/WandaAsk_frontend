import { Video, Users, CheckSquare, ListChecks, FileText } from 'lucide-react';

import {
  getMainDashboardData,
  GreetingBlock,
  MeetingsDayBlock,
  LastMeetingBlock,
  AgentTasksBlock,
  KpiOverviewBlock,
  ChartsBlockLoader,
  AgentRecommendationsBlock,
  TopParticipantsBlock,
  DashboardTabs,
  AgentActivityStatsBlock,
} from '@/features/main-dashboard';
import { KpiCard, SummaryHeader } from '@/features/summary';
import { getSummaryData } from '@/features/summary/api/summary';
import { StatsSection } from '@/features/summary/ui/stats-section';

/**
 * MainDashboardPage — rich visual overview of the user's workspace.
 * Contains two tabs:
 *  - Main: greeting, meetings, KPI metrics, charts, agent tasks, recommendations.
 *  - Statistics: full summary report (meetings, tasks, follow-ups, participants).
 * @returns JSX element.
 */
export default async function MainDashboardPage() {
  const [
    {
      user,
      todayEvents,
      tomorrowEvents,
      lastMeeting,
      agentTasks,
      summary,
      agentStats,
      recentAgentActivity,
      agentActivityTotal,
      canManageAgents,
    },
    summaryData,
  ] = await Promise.all([getMainDashboardData(), getSummaryData()]);

  const mainContent = (
    <div className='flex flex-col gap-5 p-2'>
      {/* Greeting + date */}
      <GreetingBlock name={user?.name ?? null} />

      {/* KPI overview row */}
      {summary && <KpiOverviewBlock summary={summary} />}

      {/* Today & tomorrow meetings side by side */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <MeetingsDayBlock title='Today' events={todayEvents} />
        <MeetingsDayBlock title='Tomorrow' events={tomorrowEvents} />
      </div>

      {/* Last meeting + recommendations side by side */}
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <LastMeetingBlock meeting={lastMeeting} />
        <AgentRecommendationsBlock summary={summary} agentTasks={agentTasks} />
      </div>

      {/* Charts: meeting trend + task/followup donuts */}
      {summary && <ChartsBlockLoader summary={summary} />}

      {/* Agent tasks + top participants */}
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <AgentTasksBlock tasks={agentTasks} />
        {summary && (
          <TopParticipantsBlock participants={summary.participants.top} />
        )}
      </div>

      {/* Agent activity stats */}
      <AgentActivityStatsBlock
        stats={agentStats}
        recentActivity={recentAgentActivity}
        activityTotal={agentActivityTotal}
        canManageAgents={canManageAgents}
      />
    </div>
  );

  const statisticsContent = summaryData ? (
    <div className='flex flex-col gap-6 p-2'>
      {/* Header */}
      <SummaryHeader />

      {/* KPI row */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5'>
        <KpiCard
          label='Meetings'
          value={summaryData.meetings.total}
          icon={<Video className='h-4 w-4' />}
          accent
        />
        <KpiCard
          label='Unique participants'
          value={summaryData.participants.total_unique}
          icon={<Users className='h-4 w-4' />}
        />
        <KpiCard
          label='Tasks'
          value={summaryData.tasks.total}
          icon={<CheckSquare className='h-4 w-4' />}
        />
        <KpiCard
          label='Follow-ups'
          value={summaryData.followups.total}
          icon={<ListChecks className='h-4 w-4' />}
        />
        <KpiCard
          label='Summaries'
          value={summaryData.summaries.total}
          icon={<FileText className='h-4 w-4' />}
        />
      </div>

      <StatsSection data={summaryData} />
    </div>
  ) : (
    <div className='flex flex-col gap-6 p-2'>
      <SummaryHeader />
      <div className='flex flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border border-border bg-card p-12 text-center shadow-card'>
        <p className='text-base font-medium text-foreground'>
          Statistics unavailable
        </p>
        <p className='text-sm text-muted-foreground'>Try to reload page</p>
      </div>
    </div>
  );

  return (
    <div className='flex flex-col h-full overflow-hidden p-2'>
      <DashboardTabs
        mainContent={mainContent}
        statisticsContent={statisticsContent}
      />
    </div>
  );
}
