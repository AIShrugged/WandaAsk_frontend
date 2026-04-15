export type BriefingState = 'empty' | 'waiting' | 'active';
export type MeetingState = 'scheduled' | 'waiting' | 'ready';
export type TaskStatus =
  | 'open'
  | 'in_progress'
  | 'paused'
  | 'review'
  | 'reopen'
  | 'done';

export interface TodayBriefing {
  state: BriefingState;
  date: string;
  events: TodayEvent[];
  carried_tasks: CarriedTask[];
  waiting_on_you: WaitingTask[];
  stale: StaleTask[];
  nudge: string | null;
}

export interface TodayEvent {
  id: number;
  title: string;
  starts_at: string;
  ends_at: string;
  participants_count: number;
  platform: string | null;
  meeting_url: string | null;
  meeting_state: MeetingState;
  summary: MeetingSummaryBrief | null;
  review: MeetingReviewBrief | null;
  tasks: MeetingTask[];
  total_tasks_count: number;
  done_tasks_count: number;
  agenda_content: string | null;
}

export interface MeetingAttendee {
  name: string;
}

export interface MeetingSummaryBrief {
  title: string;
  summary: string;
  key_points: string[];
  decisions: string[];
  attendees?: MeetingAttendee[];
}

export interface MeetingReviewBrief {
  key_insight: string | null;
  suggestions: string[];
}

export interface MeetingTask {
  id: number;
  name: string;
  description: string | null;
  status: TaskStatus;
  assignee_name: string | null;
  assignee_id: number | null;
  due_date: string | null;
  is_overdue: boolean;
}

export interface CarriedTask {
  id: number;
  name: string;
  status: TaskStatus;
  assignee_id: number | null;
  assignee_name: string | null;
  source_meeting_title: string;
  source_meeting_date: string;
  syncs_since_created: number;
}

export interface WaitingTask {
  id: number;
  name: string;
  description: string | null;
  age_days: number;
  source_meeting_title: string | null;
}

export interface StaleTask {
  id: number;
  name: string;
  assignee_name: string | null;
  description: string | null;
  syncs_since_created: number;
}
