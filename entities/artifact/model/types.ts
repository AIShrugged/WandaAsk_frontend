// ─── Artifact domain types ────────────────────────────────────────────────────
// Canonical home for all artifact-related types.
// features/chat/model/types.ts re-exports these for backward compatibility.

export type ArtifactStatus = 'ready' | 'generating' | 'failed';

export type ArtifactType =
  | 'task_table'
  | 'meeting_card'
  | 'people_list'
  | 'insight_card'
  | 'chart'
  | 'transcript_view'
  | 'methodology_criteria'
  | 'decision_log'
  | 'task_summary';

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

export type MethodologyCriteriaBlock =
  | { type: 'header'; text: string }
  | { type: 'scoring_table'; columns: string[]; rows: (string | number)[][] }
  | {
      type: 'progress_summary';
      items: { label: string; value: number; max: number | null }[];
    }
  | { type: 'scale'; title: string; items: { score: number; label: string }[] }
  | { type: 'text_list'; title: string; items: string[] };

export interface MethodologyCriteriaArtifact extends ArtifactBase {
  type: 'methodology_criteria';
  data: {
    blocks: MethodologyCriteriaBlock[];
  };
}

export type DecisionEntry =
  | {
      source_type: 'meeting';
      id: number;
      text: string;
      topic: string | null;
      author: { id: number | null; name: string | null };
      meeting: { id: number; title: string; date: string } | null;
      created_at: string;
    }
  | {
      source_type: 'manual' | 'chat';
      id: number;
      text: string;
      topic: string | null;
      author: { id: number | null; name: string | null };
      meeting: null;
      created_at: string;
    };

export interface DecisionLogArtifact extends ArtifactBase {
  type: 'decision_log';
  data: {
    team_id: number;
    team_name: string;
    query: string | null;
    decisions: DecisionEntry[];
  };
}

export interface TaskSummaryArtifact extends ArtifactBase {
  type: 'task_summary';
  data: {
    total: number;
    in_progress: number;
    completed: number;
    overdue: number;
    delta_week: number;
    delta_today: number | null;
    period_label: string | null;
  };
}

export type Artifact =
  | TaskTableArtifact
  | MeetingCardArtifact
  | PeopleListArtifact
  | InsightCardArtifact
  | ChartArtifact
  | TranscriptArtifact
  | MethodologyCriteriaArtifact
  | DecisionLogArtifact
  | TaskSummaryArtifact;

export interface ArtifactsResponse {
  artifacts: Record<string, Artifact>;
  layout: { items: { id: string }[] };
}
