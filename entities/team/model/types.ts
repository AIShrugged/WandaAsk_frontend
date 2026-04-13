import type { EventProps } from '@/entities/event';
import type { UserBasicProps } from '@/entities/user';

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

export interface TeamUserRecord {
  id: number; // TeamUser pivot ID — used for kick
  user: {
    id: number;
    name: string;
    email: string;
  };
}

export interface TeamFollowUpDTO {
  id: number;
  team_id: number;
  methodology_id: number | null;
  is_deprecated: boolean;
  text: string;
  status: 'in_progress' | 'done' | 'failed';
  created_at: string | null;
  updated_at: string;
  user: UserBasicProps | null;
  calendar_event: EventProps | null;
}
