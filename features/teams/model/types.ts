import type { EventProps } from '@/features/event/model/types';
import type { UserProps } from '@/features/user/model/types';

export interface TeamProps extends TeamCreateDTO {
  id: number;
  employee_count: number;
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
  calendar_event_id: number;
  team_id: number;
  text: string;
  status: string;
  created_at: Date;
  updated_at: Date;
  user: UserProps;
  calendar_event: EventProps;
}
