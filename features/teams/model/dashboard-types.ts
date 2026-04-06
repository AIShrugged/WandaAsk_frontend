export interface DashboardMember {
  id: number;
  name: string;
  email: string;
}

export interface DashboardMeetingRef {
  id: number;
  title: string;
  starts_at: string;
}

export interface DashboardAssignee {
  id?: number;
  name: string;
}

export interface DashboardMeetingCard {
  id: number;
  title: string;
  starts_at: string;
  ends_at: string;
  platform: string;
  url: string | null;
  meeting_link: { label: string; url: string } | null;
  description: string | null;
  participants_count: number;
  has_summary: boolean;
  summary_excerpt: string;
  review_score: number | null;
}

export type IssueStatus =
  | 'done'
  | 'open'
  | 'in_progress'
  | 'paused'
  | 'review'
  | 'reopen';

export interface DashboardTaskCard {
  id: number;
  title: string;
  description: string | null;
  status: IssueStatus;
  assignee: DashboardAssignee | null;
  due_date: string | null;
  meeting: DashboardMeetingRef | null;
  priority: 'high' | 'medium' | 'normal' | null;
}

export interface TeamDashboardKpis {
  action_items: {
    total: number;
    across_meetings: number;
    done: number;
    in_progress: number;
    overdue: number;
  };
  meetings: {
    total: number;
    with_summary: number;
    with_review: number;
    completion_rate: number;
  };
  people: {
    total: number;
  };
}

export type SectionTone = 'success' | 'danger' | 'warning' | 'neutral' | 'info';

export interface StatusSection {
  key: string;
  label: string;
  tone: SectionTone;
  count: number;
  items: DashboardTaskCard[];
}

export interface TabStatus {
  sections: StatusSection[];
}

export interface ReadinessCheck {
  key: string;
  label: string;
  value: boolean;
}

export interface TabMeetingReadiness {
  status: 'ready' | 'attention' | 'none';
  score: number;
  meeting: DashboardMeetingCard | null;
  checks: ReadinessCheck[];
  notes: string[];
}

export interface PersonMember {
  id: number;
  name: string;
  email: string;
  open_tasks: number;
  done_tasks: number;
  overdue_tasks: number;
  latest_meeting: DashboardMeetingRef | null;
}

export interface TabPeople {
  members: PersonMember[];
}

export interface HealthIndicator {
  key: string;
  label: string;
  value: string | number;
}

export interface TabHealth {
  score: number;
  status: 'healthy' | 'warning' | 'risk';
  indicators: HealthIndicator[];
}

export interface RiskItem {
  id: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  subtitle: string;
  source: 'task' | 'meeting';
}

export interface TabRisks {
  items: RiskItem[];
}

export interface DecisionItem {
  id: string;
  title: string;
  subtitle: string;
  meeting_date: string;
  source: 'summary';
}

export interface TeamDashboardData {
  team: {
    id: number;
    name: string;
    slug: string;
    employee_count: number;
    members: DashboardMember[];
  };
  kpis: TeamDashboardKpis;
  tabs: {
    status: TabStatus;
    meeting_readiness: TabMeetingReadiness;
    people: TabPeople;
    health: TabHealth;
    risks: TabRisks;
  };
  sections: {
    since_last_week: StatusSection[];
    deadlines_and_priorities: DashboardTaskCard[];
    decisions_needed: DecisionItem[];
  };
  upcoming_meeting: DashboardMeetingCard | null;
  latest_meeting: DashboardMeetingCard | null;
  viewer: { id: number; name: string };
}

export const TONE_TO_BADGE_VARIANT = {
  success: 'success',
  danger: 'destructive',
  warning: 'warning',
  neutral: 'default',
  info: 'primary',
} as const satisfies Record<SectionTone, 'success' | 'destructive' | 'warning' | 'default' | 'primary'>;
