'use server';

import { getAgentTasks } from '@/features/agents/api/agents';
import { getEvents } from '@/features/event/api/calendar-events';
import { getSummaryData } from '@/features/summary/api/summary';
import { getUser } from '@/features/user';

import type { MainDashboardData } from '@/features/main-dashboard/model/types';

/**
 * getMainDashboardData.
 * @returns Promise with all data needed for the main dashboard page.
 */
export async function getMainDashboardData(): Promise<MainDashboardData> {
  const [userResult, eventsResult, agentTasksResult, summaryResult] =
    await Promise.allSettled([
      getUser(),
      getEvents(),
      getAgentTasks(),
      getSummaryData(),
    ]);

  const user = userResult.status === 'fulfilled' ? userResult.value.data : null;

  const allEvents =
    eventsResult.status === 'fulfilled' ? eventsResult.value.data : [];

  const agentTasks =
    agentTasksResult.status === 'fulfilled' ? agentTasksResult.value.data : [];

  const summary =
    summaryResult.status === 'fulfilled' ? summaryResult.value : null;

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

  return {
    user,
    todayEvents,
    tomorrowEvents,
    lastMeeting,
    agentTasks,
    summary,
  };
}
