export interface AgendaCalendarEvent {
  id: number;
  title: string;
  starts_at: string;
  ends_at: string;
}

export type AgendaStatus = 'pending' | 'in_progress' | 'done' | 'failed';
export type AgendaType = 'general' | 'personal';

export interface GeneralAgendaJson {
  previous_meeting_recap: string | null;
  topics_to_discuss: string[];
  team_tasks_overview: string | null;
}

export interface PersonalAgendaTask {
  name: string;
  status: string;
  due_date: string | null;
}

export interface PersonalAgendaCompletedTask {
  name: string;
  close_date: string | null;
}

export interface PersonalAgendaDueItem {
  name: string;
  description: string;
}

export interface PersonalAgendaJson {
  previous_meeting_recap: string | null;
  assigned_tasks: PersonalAgendaTask[];
  completed_since_last: PersonalAgendaCompletedTask[];
  due_by_this_meeting: PersonalAgendaDueItem[];
  discussion_points: string[];
}

export type MeetingAgenda =
  | {
      id: number;
      calendar_event_id: number;
      user_id: null;
      type: 'general';
      status: AgendaStatus;
      content: string | null;
      raw_json: GeneralAgendaJson | null;
      sent_at: string | null;
      send_scheduled_at: string | null;
      created_at: string;
      updated_at: string;
      calendar_event: AgendaCalendarEvent;
    }
  | {
      id: number;
      calendar_event_id: number;
      user_id: number;
      type: 'personal';
      status: AgendaStatus;
      content: string | null;
      raw_json: PersonalAgendaJson | null;
      sent_at: string | null;
      send_scheduled_at: string | null;
      created_at: string;
      updated_at: string;
      calendar_event: AgendaCalendarEvent;
    };
