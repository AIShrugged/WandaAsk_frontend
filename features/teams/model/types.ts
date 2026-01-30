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

export interface TeamFollowUpDTO {
  id: number;
  calendar_event_id: number;
  team_id: number;
  text: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}
