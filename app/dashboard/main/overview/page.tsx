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
  AgentActivityStatsBlock,
  NextMeetingPrepBlock,
} from '@/features/main-dashboard';

export const metadata = { title: 'Dashboard' };

/**
 * Main dashboard overview tab page.
 */
export default async function MainOverviewPage() {
  const {
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
    upcomingAgenda,
    latestMeetingTasks,
  } = await getMainDashboardData();

  return (
    <div className='flex flex-col gap-5 p-2'>
      <GreetingBlock name={user?.name ?? null} />

      {summary && <KpiOverviewBlock summary={summary} />}

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <MeetingsDayBlock title='Today' events={todayEvents} />
        <MeetingsDayBlock title='Tomorrow' events={tomorrowEvents} />
      </div>

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <LastMeetingBlock meeting={lastMeeting} />
        <AgentRecommendationsBlock summary={summary} agentTasks={agentTasks} />
      </div>

      {summary && <ChartsBlockLoader summary={summary} />}

      <NextMeetingPrepBlock
        agenda={upcomingAgenda}
        latestTasks={latestMeetingTasks}
      />

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <AgentTasksBlock tasks={agentTasks} />
        {summary && (
          <TopParticipantsBlock participants={summary.participants.top} />
        )}
      </div>

      <AgentActivityStatsBlock
        stats={agentStats}
        recentActivity={recentAgentActivity}
        activityTotal={agentActivityTotal}
        canManageAgents={canManageAgents}
      />
    </div>
  );
}
