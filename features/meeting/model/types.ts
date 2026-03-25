export type MeetingTaskStatus = 'open' | 'in_progress' | 'done' | 'cancelled';

/** Matches backend MeetingTaskResource */
export interface MeetingTask {
  id: number;
  taskable_type: string;
  taskable_id: number;
  profile_id: number | null;
  title: string;
  description: string | null;
  assignee_name: string | null;
  due_date: string | null;
  status: MeetingTaskStatus;
  created_at: string;
  updated_at: string;
}
