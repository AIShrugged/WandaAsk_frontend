export type UpcomingAgendaStatus = 'pending' | 'in_progress' | 'done' | 'failed';

export interface UpcomingAgendaRaw {
  next_meeting_context: string | null;
  follow_up_items: string[];
  open_questions: string[];
  focus_areas: string[];
}

export interface UpcomingAgenda {
  id: number;
  status: UpcomingAgendaStatus;
  content: string | null;
  raw_json: UpcomingAgendaRaw | null;
  source_meeting_title: string;
  source_meeting_date: string;
  source_meeting_id: number;
  source_meeting_participants: string[];
  created_at: string;
  updated_at: string;
}

export interface LatestMeetingTask {
  id: number;
  name: string;
  description: string | null;
  assignee_name: string | null;
  due_date: string | null;
  status: 'open' | 'in_progress' | 'done' | 'cancelled';
}

export interface LatestMeetingTasksData {
  meeting_title: string | null;
  meeting_date: string | null;
  meeting_id: number | null;
  tasks: LatestMeetingTask[];
  other_tasks: LatestMeetingTask[];
}
