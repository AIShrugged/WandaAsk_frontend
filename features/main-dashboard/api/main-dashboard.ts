'use server';

import { getAgentActivity } from '@/features/agents/api/activity';
import { getAgentTasks } from '@/features/agents/api/agents';
import { getAgentAccessContext } from '@/features/agents/lib/access';
import { getEvents } from '@/features/event/api/calendar-events';
import {
  getLatestMeetingTasks,
  getUpcomingAgenda,
} from '@/features/main-dashboard/api/upcoming-agenda';
import { deriveAgentStats } from '@/features/main-dashboard/lib/derive-agent-stats';
import { getSummaryData } from '@/features/summary/api/summary';
import { getUser } from '@/features/user';

import type { MainDashboardData } from '@/features/main-dashboard/model/types';

const RECENT_ACTIVITY_LIMIT = 5;

/**
 * getMainDashboardData.
 * @returns Promise with all data needed for the main dashboard page.
 */
export async function getMainDashboardData(): Promise<MainDashboardData> {
  const [
    userResult,
    eventsResult,
    agentTasksResult,
    summaryResult,
    activityResult,
    accessResult,
    upcomingAgendaResult,
    latestTasksResult,
  ] = await Promise.allSettled([
    getUser(),
    getEvents(),
    getAgentTasks(),
    getSummaryData(),
    getAgentActivity(0, RECENT_ACTIVITY_LIMIT),
    getAgentAccessContext(),
    getUpcomingAgenda(),
    getLatestMeetingTasks(),
  ]);
  const user = userResult.status === 'fulfilled' ? userResult.value.data : null;
  const allEvents =
    eventsResult.status === 'fulfilled' ? eventsResult.value.data : [];
  const agentTasks =
    agentTasksResult.status === 'fulfilled' ? agentTasksResult.value.data : [];
  const summary =
    summaryResult.status === 'fulfilled' ? summaryResult.value : null;
  const recentAgentActivity =
    activityResult.status === 'fulfilled' ? activityResult.value.items : [];
  const agentActivityTotal =
    activityResult.status === 'fulfilled' ? activityResult.value.totalCount : 0;
  const canManageAgents =
    accessResult.status === 'fulfilled'
      ? accessResult.value.canManageAgents
      : false;
  const upcomingAgenda =
    upcomingAgendaResult.status === 'fulfilled'
      ? upcomingAgendaResult.value
      : null;
  const latestMeetingTasks =
    latestTasksResult.status === 'fulfilled'
      ? latestTasksResult.value
      : { meeting_title: null, meeting_date: null, meeting_id: null, tasks: [], other_tasks: [] };
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const tomorrow = new Date(now);

  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);
  const todayEvents = allEvents.filter((e) => {
    return e.starts_at.slice(0, 10) === todayStr;
  });
  const tomorrowEvents = allEvents.filter((e) => {
    return e.starts_at.slice(0, 10) === tomorrowStr;
  });
  // Last meeting: most recent event that has already ended
  const pastEvents = allEvents
    .filter((e) => {
      return new Date(e.ends_at) < now;
    })
    .toSorted((a, b) => {
      return new Date(b.ends_at).getTime() - new Date(a.ends_at).getTime();
    });
  const lastMeeting = pastEvents[0] ?? null;
  const agentStats = deriveAgentStats(agentTasks);

  return {
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
  };
}
