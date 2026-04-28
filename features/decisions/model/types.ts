export type DecisionSourceType = 'meeting' | 'manual' | 'chat';

export interface Decision {
  id: number;
  text: string;
  topic: string | null;
  source_type: DecisionSourceType;
  team_id: number | null;
  organization_id: number | null;
  calendar_event_id: number | null;
  summary_id: number | null;
  author_raw_name: string | null;
  author: {
    id: number;
    name: string;
    email: string;
  } | null;
  calendar_event: {
    id: number;
    title: string;
    starts_at: string;
  } | null;
  issues: { id: number; name: string }[] | null;
  created_at: string;
  updated_at: string;
}

export interface DecisionCreateDTO {
  text: string;
  topic?: string | null;
}

export interface DecisionFilters {
  source_type?: DecisionSourceType | null;
  search?: string | null;
}
