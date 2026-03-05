// ------------------------------
// Summary feature types
// ------------------------------

export interface MeetingMonthStat {
  month: string; // "2026-01"
  count: number;
  total_duration_minutes: number;
}

export interface RecentMeeting {
  id: number;
  title: string;
  starts_at: string; // ISO datetime
  ends_at: string; // ISO datetime
  duration_minutes: number;
  participants_count: number;
}

export interface MeetingStats {
  total: number;
  with_bot: number;
  total_duration_minutes: number;
  average_duration_minutes: number;
  recent: RecentMeeting[];
  by_month: MeetingMonthStat[];
}

export interface TopParticipant {
  name: string;
  meetings_count: number;
}

export interface ParticipantStats {
  total_unique: number;
  average_per_meeting: number;
  top: TopParticipant[];
}

export interface TasksByStatus {
  open: number;
  in_progress: number;
  done: number;
  cancelled: number;
}

export interface TaskStats {
  total: number;
  by_status: TasksByStatus;
  overdue: number;
}

export interface FollowupsByStatus {
  done: number;
  in_progress: number;
  failed: number;
}

export interface FollowupStats {
  total: number;
  by_status: FollowupsByStatus;
}

export interface TeamEntry {
  id: number;
  name: string;
  members_count: number;
}

export interface TeamStats {
  total: number;
  list: TeamEntry[];
}

export interface DashboardApiResponse {
  meetings: MeetingStats;
  participants: ParticipantStats;
  tasks: TaskStats;
  followups: FollowupStats;
  summaries: { total: number };
  teams: TeamStats;
}
