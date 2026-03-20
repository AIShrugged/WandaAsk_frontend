export interface AgentToolDefinition {
  name: string;
  label?: string | null;
  description?: string | null;
  [key: string]: unknown;
}

export interface AgentProfile {
  id: number;
  name: string;
  description: string | null;
  allowed_tools: string[] | null;
  sandbox_profile: string | null;
  model?: string | null;
  config?: Record<string, unknown> | null;
  profile_schema?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface AgentProfilePayload {
  name: string;
  description: string | null;
  allowed_tools: string[];
  sandbox_profile: string | null;
  model?: string | null;
  config?: Record<string, unknown> | null;
}

export interface AgentTaskOrganization {
  id: number;
  name?: string | null;
  slug?: string | null;
  display_name?: string | null;
}

export interface AgentTaskTeam {
  id: number;
  name?: string | null;
}

export interface AgentTask {
  id: number;
  name: string;
  prompt: string | null;
  organization_id: number | null;
  team_id: number | null;
  agent_profile_id: number | null;
  schedule_type: string | null;
  interval_seconds: number | null;
  execution_mode: string | null;
  agent_task_type: string | null;
  output_mode: string | null;
  allowed_tools: string[] | null;
  input_payload: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  enabled: boolean;
  next_run_at: string | null;
  latest_run_status?: string | null;
  organization?: AgentTaskOrganization | null;
  team?: AgentTaskTeam | null;
  agent_profile?: Pick<AgentProfile, 'id' | 'name'> | null;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface AgentTaskPayload {
  name: string;
  prompt: string | null;
  organization_id: number;
  team_id: number | null;
  agent_profile_id: number;
  schedule_type: string;
  interval_seconds: number | null;
  execution_mode: string;
  agent_task_type: string;
  output_mode: string | null;
  allowed_tools: string[];
  input_payload: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  enabled: boolean;
}

export interface AgentTaskRun {
  id: number;
  status: string;
  attempt: number | null;
  scheduled_for: string | null;
  started_at: string | null;
  finished_at: string | null;
  output: unknown;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
  handoff?: unknown;
  plan?: unknown;
  lineage?: unknown;
  followup?: unknown;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
}

export interface AgentTasksMeta {
  execution_modes?: unknown;
  schedule_types?: unknown;
  agent_task_types?: unknown;
  output_modes?: unknown;
  sandbox_profiles?: unknown;
  [key: string]: unknown;
}

export interface AgentSelectOption {
  value: string;
  label: string;
  description?: string | null;
}

export interface AgentActionError {
  data: null;
  error: string;
  fieldErrors?: Record<string, string>;
  status?: number;
}

/**
 *
 * @param value
 */
export function isAgentActionError(value: unknown): value is AgentActionError {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'error' in value &&
      typeof (value as { error?: unknown }).error === 'string',
  );
}
