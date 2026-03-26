import type { EventProps } from '@/entities/event';
// eslint-disable-next-line boundaries/element-types
import type {
  AgentActivityItem,
  AgentTask,
} from '@/features/agents/model/types';
// eslint-disable-next-line boundaries/element-types
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
}
