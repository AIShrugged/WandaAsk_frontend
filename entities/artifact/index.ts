// Public API for entities/artifact
// Artifact renderers and data access shared between features/chat and follow-up analysis

export { ArtifactCard } from '@/entities/artifact/ui/artifact-card';
export { ChartArtifactView } from '@/entities/artifact/ui/chart-artifact';
export { InsightCard } from '@/entities/artifact/ui/insight-card';
export { MeetingCard } from '@/entities/artifact/ui/meeting-card';
export { MethodologyCriteria } from '@/entities/artifact/ui/methodology-criteria';
export { PeopleList } from '@/entities/artifact/ui/people-list';
export { TaskTable } from '@/entities/artifact/ui/task-table';
export { TranscriptView } from '@/entities/artifact/ui/transcript-view';

export { getArtifacts } from '@/entities/artifact/api/artifacts';

export type {
  Artifact,
  ArtifactStatus,
  ArtifactType,
  ArtifactsResponse,
} from '@/entities/artifact/model/types';
