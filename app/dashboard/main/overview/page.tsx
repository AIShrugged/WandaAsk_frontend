import {
  getMainDashboardData,
  MeetingsBlock,
  UpcomingAgendasBlock,
  IssuesBlock,
  AgentTasksBlock,
} from '@/features/main-dashboard';

export const metadata = { title: 'Overview' };

/**
 * Main dashboard overview tab page.
 */
export default async function MainOverviewPage() {
  const {
    todayEvents,
    tomorrowEvents,
    pastEvents,
    agentTasks,
    canManageAgents,
    agendas,
    issues,
  } = await getMainDashboardData();

  return (
    <div className='flex flex-col gap-5 p-2'>
      <MeetingsBlock
        todayEvents={todayEvents}
        tomorrowEvents={tomorrowEvents}
        pastEvents={pastEvents}
      />

      <UpcomingAgendasBlock agendas={agendas} />

      <IssuesBlock issues={issues} />

      <AgentTasksBlock tasks={agentTasks} canManageAgents={canManageAgents} />
    </div>
  );
}
