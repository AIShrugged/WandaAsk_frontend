/** Single chat conversation as returned by GET /api/v1/chats and related endpoints */
export interface Chat {
  id: number;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export type MessageStatus =
  | 'queued'
  | 'processing'
  | 'retrying'
  | 'completed'
  | 'failed';

/** A single message within a chat as returned by the messages sub-resource */
export interface Message {
  id: number;
  chat_id: number;
  role: 'user' | 'assistant';
  status: MessageStatus | null;
  content: string;
  followup_data: unknown | null;
  error_message: string | null;
  failure_code: string | null;
  agent_run_uuid: string | null;
  current_attempt: number | null;
  max_attempts: number | null;
  completed_at: string | null;
  next_retry_at: string | null;
  created_at: string;
}

/** Response from GET /api/v1/chats/{chat}/runs/{runUuid} */
export interface AgentRun {
  agent_run_uuid: string;
  chat_id: number;
  message_id: number;
  status: MessageStatus;
  progress_percent: number;
  current_step_label: string | null;
  error_message: string | null;
  failure_code: string | null;
  current_attempt: number;
  max_attempts: number;
  completed_at: string | null;
  next_retry_at: string | null;
  message: {
    id: number;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
  };
}

/** Envelope returned by paginated list endpoints */
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  message: string;
  status: number;
  /** Total item count comes from the Items-Count response header */
  meta?: Record<string, unknown>;
}

/** Envelope returned by single-resource endpoints */
export interface SingleResponse<T> {
  success: boolean;
  data: T;
  message: string;
  status: number;
}

// ─── Artifacts ────────────────────────────────────────────────────────────────

export type ArtifactStatus = 'ready' | 'generating' | 'failed';
export type ArtifactType =
  | 'task_table'
  | 'meeting_card'
  | 'people_list'
  | 'insight_card'
  | 'chart'
  | 'transcript_view';

interface ArtifactBase {
  id: string;
  title: string;
  status: ArtifactStatus;
}

export interface TaskTableArtifact extends ArtifactBase {
  type: 'task_table';
  data: {
    tasks: {
      title: string;
      status: string;
      due_date: string | null;
      description: string;
      assignee_name: string;
    }[];
  };
}

export interface MeetingCardArtifact extends ArtifactBase {
  type: 'meeting_card';
  data: {
    title: string;
    starts_at: string;
    ends_at: string;
    summary: string;
    decisions: string[];
    key_points: string[];
    participants: string[];
  };
}

export interface PeopleListArtifact extends ArtifactBase {
  type: 'people_list';
  data: {
    members: {
      name: string;
      role: string;
      user_id: number;
    }[];
  };
}

export interface InsightCardArtifact extends ArtifactBase {
  type: 'insight_card';
  data: {
    person: { name: string; profile_id: number };
    insights: {
      category: string;
      content: Record<string, unknown>;
    }[];
  };
}

export type ChartType = 'bar' | 'line' | 'area';

export interface ChartArtifact extends ArtifactBase {
  type: 'chart';
  data: {
    title: string;
    chart_type: ChartType;
    labels: string[];
    datasets: { label: string; data: number[] }[];
  };
}

export interface TranscriptArtifact extends ArtifactBase {
  type: 'transcript_view';
  data: {
    meeting_title: string;
    entries: {
      speaker: string;
      timestamp: string;
      text: string;
    }[];
  };
}

export type Artifact =
  | TaskTableArtifact
  | MeetingCardArtifact
  | PeopleListArtifact
  | InsightCardArtifact
  | ChartArtifact
  | TranscriptArtifact;

export interface ArtifactsResponse {
  artifacts: Record<string, Artifact>;
  layout: { items: { id: string }[] };
}
