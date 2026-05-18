export type ArtifactStatus = 'ready' | 'generating' | 'failed';

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
      status: string | null;
      due_date: string | null;
      description: string | null;
      assignee_name: string | null;
    }[];
  };
}

export interface MeetingCardArtifact extends ArtifactBase {
  type: 'meeting_card';
  data: {
    title: string;
    starts_at: string;
    ends_at: string | null;
    summary: string | null;
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
      role: string | null;
      profile_id: number | null;
      user_id: number | null;
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

export type ChartType = 'bar' | 'line' | 'pie';

export interface ChartArtifact extends ArtifactBase {
  type: 'chart';
  data: {
    title: string | null;
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
      timestamp: string | null;
      text: string;
    }[];
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

export type Artifact =
  | TaskTableArtifact
  | MeetingCardArtifact
  | PeopleListArtifact
  | InsightCardArtifact
  | ChartArtifact
  | TranscriptArtifact
  | DecisionLogArtifact
  | MethodologyCriteriaArtifact;

export type ArtifactType = Artifact['type'];

export interface ArtifactsResponse {
  artifacts: Record<string, Artifact>;
  layout: { items: { id: string }[] };
}
