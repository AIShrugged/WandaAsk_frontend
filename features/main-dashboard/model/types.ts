import type { EventProps } from '@/entities/event';
import type {
  AgentActivityItem,
  AgentTask,
} from '@/features/agents/model/types';
import type { AgentStats } from '@/features/main-dashboard/lib/derive-agent-stats';
import type { MeetingAgenda } from '@/features/main-dashboard/model/agenda-types';
import type { DashboardApiResponse } from '@/features/summary/types';
export type { AgentStats } from '@/features/main-dashboard/lib/derive-agent-stats';

export interface MainDashboardData {
  user: { id: number; name: string; email: string } | null;
  todayEvents: EventProps[];
  tomorrowEvents: EventProps[];
  lastMeeting: EventProps | null;
  agentTasks: AgentTask[];
  summary: DashboardApiResponse | null;
  agentStats: AgentStats;
  recentAgentActivity: AgentActivityItem[];
  agentActivityTotal: number;
  canManageAgents: boolean;
  upcomingAgendas: MeetingAgenda[];
}
