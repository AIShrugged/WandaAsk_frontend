'use server';

import { getAgentTasks } from '@/features/agents/api/agents';
import { getAgentAccessContext } from '@/features/agents/lib/access';
import { getEvents } from '@/features/event/api/calendar-events';
import { getIssues } from '@/features/issues/api/issues';
import { getMyAgendas } from '@/features/main-dashboard/api/agendas';
import { getUser } from '@/features/user';

import type { MainDashboardData } from '@/features/main-dashboard/model/types';

/**
 * getMainDashboardData.
 * @returns Promise with all data needed for the main dashboard page.
 */
export async function getMainDashboardData(): Promise<MainDashboardData> {
  const [
    userResult,
    eventsResult,
    agentTasksResult,
    accessResult,
    agendasResult,
    openIssuesResult,
    inProgressIssuesResult,
  ] = await Promise.allSettled([
    getUser(),
    getEvents(),
    getAgentTasks(),
    getAgentAccessContext(),
    getMyAgendas(),
    getIssues({ status: 'open', sort: 'created_at', order: 'desc', limit: 20 }),
    getIssues({
      status: 'in_progress',
      sort: 'created_at',
      order: 'desc',
      limit: 20,
    }),
  ]);

  const user = userResult.status === 'fulfilled' ? userResult.value.data : null;
  const allEvents =
    eventsResult.status === 'fulfilled' ? eventsResult.value.data : [];
  const agentTasks =
    agentTasksResult.status === 'fulfilled' ? agentTasksResult.value.data : [];
  const canManageAgents =
    accessResult.status === 'fulfilled'
      ? accessResult.value.canManageAgents
      : false;
  const agendas =
    agendasResult.status === 'fulfilled' ? agendasResult.value : [];
  const openIssues =
    openIssuesResult.status === 'fulfilled' ? openIssuesResult.value.data : [];
  const inProgressIssues =
    inProgressIssuesResult.status === 'fulfilled'
      ? inProgressIssuesResult.value.data
      : [];

  // Merge and sort open + in_progress issues by created_at desc
  const issues = [...openIssues, ...inProgressIssues].toSorted((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

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
  const pastEvents = allEvents
    .filter((e) => {
      return new Date(e.ends_at) < now;
    })
    .toSorted((a, b) => {
      return new Date(b.ends_at).getTime() - new Date(a.ends_at).getTime();
    });

  return {
    user,
    todayEvents,
    tomorrowEvents,
    pastEvents,
    agentTasks,
    canManageAgents,
    agendas,
    issues,
  };
}
