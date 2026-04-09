import type { EventProps } from '@/entities/event';
import type { AgentTask } from '@/features/agents/model/types';
import type { Issue } from '@/features/issues/model/types';
import type { MeetingAgenda } from '@/features/main-dashboard/model/agenda-types';

export interface MainDashboardData {
  user: { id: number; name: string; email: string } | null;
  todayEvents: EventProps[];
  tomorrowEvents: EventProps[];
  pastEvents: EventProps[];
  agentTasks: AgentTask[];
  canManageAgents: boolean;
  agendas: MeetingAgenda[];
  issues: Issue[];
}
