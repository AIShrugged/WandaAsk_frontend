import type { EventProps } from '@/entities/event';
import type { UserProps } from '@/entities/user';

export interface TeamProps extends TeamCreateDTO {
  id: number;
  slug: string;
  employee_count: number;
  members: TeamMember[];
}

interface TeamMember {
  id: number;
  name: string;
  email: string;
}

export interface TeamCreateDTO {
  name: string;
}

export interface TeamAddMemberDTO {
  email: string;
}

export type TeamActionType = 'add-member' | 'delete' | 'view';

export interface TeamFollowUpDTO {
  id: number;
  team_id: number;
  methodology_id: number | null;
  text: string;
  status: string;
  created_at: Date;
  updated_at: Date;
  user: UserProps;
  calendar_event: EventProps;
}
