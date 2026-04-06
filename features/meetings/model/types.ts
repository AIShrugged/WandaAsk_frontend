import type { MeetingTask } from '@/features/meeting/types';

export interface CalendarEventListItem {
  id: number;
  title: string;
  starts_at: string;
  ends_at: string;
  platform: string;
  url?: string | null;
  description: string | null;
  required_bot: boolean;
  has_summary: boolean;
}

export interface CalendarEventReadMore {
  section?: string | null;
  anchor?: string | null;
}

export interface CalendarEventTakeaway {
  title: string;
  excerpt: string;
  full_text: string;
  kind: string;
  label?: string | null;
  read_more?: CalendarEventReadMore | null;
}

export interface CalendarEventParticipant {
  id?: number | string;
  name?: string | null;
  label?: string | null;
  title?: string | null;
  email?: string | null;
  role?: string | null;
  initials?: string | null;
  is_current_user?: boolean;
  is_chair?: boolean;
  [key: string]: unknown;
}

export interface CalendarEventAgendaItem {
  id?: number | string;
  title?: string | null;
  text?: string | null;
  description?: string | null;
  order?: number | null;
  [key: string]: unknown;
}

export type CalendarEventSectionValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Array<unknown>
  | Record<string, unknown>;

export interface CalendarEventDetailResponse {
  event: CalendarEventListItem & Record<string, unknown>;
  participants: CalendarEventParticipant[];
  agendas: CalendarEventAgendaItem[];
  tasks: MeetingTask[];
  summary: CalendarEventSectionValue;
  review: CalendarEventSectionValue;
  followup: CalendarEventSectionValue;
  previous_meeting: CalendarEventSectionValue;
  key_takeaways: CalendarEventTakeaway[];
  counts: Record<string, number | string | null | undefined>;
  [key: string]: unknown;
}
