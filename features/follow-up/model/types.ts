import type { ArtifactsResponse } from '@/entities/artifact';
import type { EventProps } from '@/entities/event';
import type { UserBasicProps } from '@/entities/user';

/** Matches backend FollowupResource */
export interface FollowUpDetailProps {
  id: number;
  calendar_event: EventProps;
  team_id: number;
  user: UserBasicProps;
  methodology_id: number | null;
  is_deprecated: boolean;
  text: ArtifactsResponse | null;
  status: 'in_progress' | 'done' | 'failed';
  created_at: string;
  updated_at: string;
}

/** Returned by POST /followups/{id}/regenerate (HTTP 202) */
export interface RegenerateFollowUpResponse {
  calendar_event_id: number;
  followup_id: number;
  status: 'in_progress';
}
