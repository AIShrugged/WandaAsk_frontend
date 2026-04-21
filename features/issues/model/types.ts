export type IssueStatus =
  | 'open'
  | 'in_progress'
  | 'paused'
  | 'review'
  | 'reopen'
  | 'done';

export function issueTypeOptionsFromOrgs(
  organizations: {
    issue_types?: { key: string; name: string; is_active: boolean }[];
  }[],
): { value: string; label: string }[] {
  const seen = new Set<string>();
  const options: { value: string; label: string }[] = [];

  for (const org of organizations) {
    for (const t of org.issue_types ?? []) {
      if (t.is_active && !seen.has(t.key)) {
        seen.add(t.key);
        options.push({ value: t.key, label: t.name });
      }
    }
  }

  return options;
}

export const ISSUE_STATUS_OPTIONS: { value: IssueStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'paused', label: 'Paused' },
  { value: 'review', label: 'Review' },
  { value: 'reopen', label: 'Reopen' },
  { value: 'done', label: 'Done' },
];

/**
 * isIssueStatus.
 * @param value - raw value.
 * @returns Result.
 */
export function isIssueStatus(value: string): value is IssueStatus {
  return ISSUE_STATUS_OPTIONS.some((option) => {
    return option.value === value;
  });
}

export interface PersonOption {
  id: number;
  name: string;
  email?: string | null;
  organization_id?: number | null;
  team_id?: number | null;
}

export interface IssueAgentFlowStep {
  id: number;
  position: number;
  kind: string | null;
  status: string | null;
  title: string | null;
  agent_task_id: number | null;
  task: {
    id: number;
    status: string | null;
    latest_run_id: number | null;
  } | null;
}

export interface IssueAgentFlow {
  id: number;
  status: string | null;
  current_step_position: number | null;
  steps: IssueAgentFlowStep[];
}

export interface IssueAgentTaskRun {
  id: number;
  status: string | null;
  current_tool: string | null;
  current_tool_description: string | null;
}

export interface Issue {
  id: number;
  name: string;
  description: string | null;
  type: string;
  status: IssueStatus;
  organization_id: number | null;
  team_id: number | null;
  agent_task_id?: number | null;
  agent_task_run?: IssueAgentTaskRun | null;
  agent_flow_id?: number | null;
  agent_flow?: IssueAgentFlow | null;
  assignee_id: number | null;
  assignee?: PersonOption | null;
  close_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface IssueAttachment {
  id: number;
  issue_id?: number | null;
  name?: string | null;
  file_name?: string | null;
  original_name?: string | null;
  file_path?: string | null;
  file_url?: string | null;
  url?: string | null;
  uploaded_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export type IssueSortField =
  | 'id'
  | 'name'
  | 'type'
  | 'status'
  | 'updated_at'
  | 'created_at';
export type SortOrder = 'asc' | 'desc';

export const VALID_SORT_FIELDS = new Set<IssueSortField>([
  'id',
  'name',
  'type',
  'status',
  'updated_at',
  'created_at',
]);

/**
 * isIssueSortField — type guard for IssueSortField.
 * @param value - raw string.
 * @returns boolean.
 */
export function isIssueSortField(value: string): value is IssueSortField {
  return VALID_SORT_FIELDS.has(value as IssueSortField);
}

/**
 * isSortOrder — type guard for SortOrder.
 * @param value - raw string.
 * @returns boolean.
 */
export function isSortOrder(value: string): value is SortOrder {
  return value === 'asc' || value === 'desc';
}

/**
 * isIssueType — accepts any non-empty string since types are org-defined.
 * @param value - raw string.
 * @returns boolean.
 */
export function isIssueType(value: string): boolean {
  return value.length > 0;
}

export interface SharedFilters {
  organization_id: string;
  team_id: string;
  search: string;
  type: string | '';
  assignee_id: string;
  status: IssueStatus | '';
  show_archived: boolean;
}

export interface IssueFilters {
  organization_id?: number | null;
  team_id?: number | null;
  status?: IssueStatus | '';
  type?: string | '';
  assignee?: number | null;
  offset?: number;
  limit?: number;
  sort?: IssueSortField;
  order?: SortOrder;
  search?: string;
  archived?: boolean;
  exclude_archived?: boolean;
  unassigned?: boolean;
}

export interface IssueCommentUser {
  id: number;
  name: string;
}

export interface IssueComment {
  id: number;
  issue_id: number;
  parent_id: number | null;
  content: string;
  user: IssueCommentUser;
  replies: IssueComment[];
  created_at: string;
  updated_at: string;
}

export interface IssueUpsertDTO {
  name: string;
  description: string | null;
  type: string;
  status: IssueStatus;
  organization_id: number | null;
  team_id: number | null;
  assignee_id: number | null;
}
