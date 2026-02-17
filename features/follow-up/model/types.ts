import type { GuestCore } from '@/entities/participant';

export interface FollowUpResponse {
  data: FollowUpDetailProps;
}

export interface FollowUpsResponse {
  data: FollowUpDetailProps[];
}

export interface FollowUpDetailProps {
  calendar_event_id: number;
  id: number;
  participant_id: null | GuestCore;
  score: string;
  status: string;
  type: string;
  text: string;
}
