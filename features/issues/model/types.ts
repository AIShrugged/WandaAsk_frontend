export type IssueStatus = 'open' | 'in_progress' | 'paused' | 'done';

export type IssueType = 'development' | 'organization';

export const ISSUE_TYPE_OPTIONS: { value: IssueType; label: string }[] = [
  { value: 'development', label: 'Development' },
  { value: 'organization', label: 'Organization' },
];

export const ISSUE_STATUS_OPTIONS: { value: IssueStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'paused', label: 'Paused' },
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

export interface Issue {
  id: number;
  name: string;
  description: string | null;
  type: IssueType;
  status: IssueStatus;
  priority?: IssuePriority | null;
  organization_id: number | null;
  team_id: number | null;
  agent_task_id?: number | null;
  assignee_id: number | null;
  assignee?: PersonOption | null;
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

export type IssuePriority = 'low' | 'medium' | 'high' | 'critical';

export const ISSUE_PRIORITY_LABELS: Record<IssuePriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export type IssueSortField =
  | 'id'
  | 'name'
  | 'type'
  | 'status'
  | 'updated_at'
  | 'created_at';
export type SortOrder = 'asc' | 'desc';

export interface IssueFilters {
  organization_id?: number | null;
  team_id?: number | null;
  status?: IssueStatus | '';
  type?: IssueType | '';
  assignee?: number | null;
  offset?: number;
  limit?: number;
  sort?: IssueSortField;
  order?: SortOrder;
  search?: string;
}

export interface IssueUpsertDTO {
  name: string;
  description: string | null;
  type: IssueType;
  status: IssueStatus;
  organization_id: number | null;
  team_id: number | null;
  assignee_id: number | null;
}
