import type { EventProps } from '@/entities/event';

export interface FollowUpResponse {
  data: FollowUpDetailProps;
}

export interface FollowUpsResponse {
  data: FollowUpDetailProps[];
}

/** Matches backend FollowupResource */
export interface FollowUpDetailProps {
  id: number;
  calendar_event: EventProps;
  team_id: number;
  user: { id: number; name: string; email: string };
  methodology_id: number | null;
  text: string;
  status: string;
  created_at: string;
  updated_at: string;
}
