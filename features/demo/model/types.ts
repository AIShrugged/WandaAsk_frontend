export type DemoGenerationStatus =
  | 'generating'
  | 'ready'
  | 'failed'
  | 'pending';

export interface DemoStatusResult {
  status: DemoGenerationStatus;
  progress_percent: number | null;
  current_step_label: string | null;
  error: string | null;
  completed_at: string | null;
}

export interface SeedDemoParams {
  teams_count?: number;
  employees_per_team?: number;
  meetings_per_team?: number;
}

export interface SeedDemoResult {
  message: string;
}
