import type { IssueStatus, PersonOption } from '@/features/issues/model/types';

export interface KanbanCard {
  id: number;
  name: string;
  description: string | null;
  type: string;
  status: IssueStatus;
  organization_id: number | null;
  team_id: number | null;
  assignee_id: number | null;
  assignee?: PersonOption | null;
  attachments_count: number;
  comments_count: number;
  story_points: number | null;
  close_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface KanbanColumn {
  id: IssueStatus;
  label: string;
  color: string;
  cards: KanbanCard[];
}

export interface KanbanFilters {
  organization_id?: number | null;
  team_id?: number | null;
  type?: string;
  assignee_id?: number | null;
  search?: string;
  archived?: boolean;
  exclude_archived?: boolean;
}

export const KANBAN_COLUMNS: Pick<KanbanColumn, 'id' | 'label' | 'color'>[] = [
  { id: 'open', label: 'To Do', color: '#94a3b8' },
  { id: 'in_progress', label: 'In Progress', color: '#f59e0b' },
  { id: 'paused', label: 'Paused', color: '#818cf8' },
  { id: 'done', label: 'Done', color: '#34d399' },
];

export { type IssueStatus } from '@/features/issues/model/types';
