export interface UserFocus {
  focus_text: string | null;
  deadline: string | null;
  expires_at: string | null;
}

export interface FocusedIssue {
  id: number;
  name: string;
  status: string;
  priority: number;
  due_date: string | null;
  assignee_id: number | null;
}

export interface FocusedIssuesMeta {
  has_focus: boolean;
  focus_text: string | null;
  matched_count?: number;
}
