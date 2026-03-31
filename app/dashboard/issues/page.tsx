import { getPersons, getIssues } from '@/features/issues';
import {
  isIssueStatus,
  ISSUE_TYPE_OPTIONS,
  type IssuePriority,
  type IssueType,
  type IssueSortField,
  type SortOrder,
} from '@/features/issues/model/types';
import { TasktrackerTabs } from '@/features/issues/ui/tasktracker-tabs';
import { getKanbanIssues } from '@/features/kanban';
import { getOrganizations } from '@/features/organization/api/organization';
import { getCurrentUserId } from '@/shared/lib/getCurrentUserId';
import { getOrganizationId } from '@/shared/lib/getOrganizationId';
import Card from '@/shared/ui/card/Card';
import PageHeader from '@/widgets/layout/ui/page-header';

import type { KanbanFilters } from '@/features/kanban/model/types';

const VALID_SORT_FIELDS = new Set<IssueSortField>([
  'id',
  'name',
  'type',
  'status',
  'updated_at',
  'created_at',
]);

function isIssueSortField(value: string): value is IssueSortField {
  return VALID_SORT_FIELDS.has(value as IssueSortField);
}

function isSortOrder(value: string): value is SortOrder {
  return value === 'asc' || value === 'desc';
}

function isIssueType(value: string): value is IssueType {
  return ISSUE_TYPE_OPTIONS.some((option) => {
    return option.value === value;
  });
}

/**
 * IssuesListPage component.
 * Combines Tasktracker (issues list) and Kanban board in two tabs with shared filters.
 * @param props - page props.
 * @param props.searchParams - search params.
 * @returns JSX element.
 */
export default async function IssuesListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const cookieOrgId = await getOrganizationId();
  const orgId =
    typeof params.organization_id === 'string'
      ? params.organization_id
      : cookieOrgId;
  const statusParam =
    typeof params.status === 'string' && isIssueStatus(params.status)
      ? params.status
      : '';
  const sortParam =
    typeof params.sort === 'string' && isIssueSortField(params.sort)
      ? params.sort
      : 'updated_at';
  const orderParam =
    typeof params.order === 'string' && isSortOrder(params.order)
      ? params.order
      : 'desc';
  const typeParam =
    typeof params.type === 'string' && isIssueType(params.type)
      ? params.type
      : '';
  const priorityParam =
    typeof params.priority === 'string'
      ? (params.priority as IssuePriority)
      : '';

  // Unified assignee_id param (replaces old split 'assignee' / 'assignee_id')
  // null → absent from URL → default to current user
  // ''   → explicitly cleared → show all
  let assigneeIdParam: string | null;
  if (!('assignee_id' in params)) {
    assigneeIdParam = null;
  } else if (typeof params.assignee_id === 'string') {
    assigneeIdParam = params.assignee_id;
  } else {
    assigneeIdParam = '';
  }

  const kanbanFilters: KanbanFilters = {
    organization_id: orgId ? Number(orgId) : null,
    team_id: params.team_id ? Number(params.team_id) : null,
    type: typeParam || undefined,
    assignee_id: assigneeIdParam ? Number(assigneeIdParam) : null,
    priority: priorityParam || undefined,
  };

  const [organizationsResponse, persons, currentUserId, groupedCards] =
    await Promise.all([
      getOrganizations(),
      getPersons(),
      getCurrentUserId(),
      getKanbanIssues(kanbanFilters),
    ]);

  let resolvedAssignee: number | null;
  if (assigneeIdParam === null) {
    resolvedAssignee = currentUserId ?? null;
  } else if (assigneeIdParam.length > 0) {
    resolvedAssignee = Number(assigneeIdParam);
  } else {
    resolvedAssignee = null;
  }

  const issues = await getIssues({
    organization_id: orgId ? Number(orgId) : null,
    team_id: params.team_id ? Number(params.team_id) : null,
    status: statusParam,
    type: typeParam,
    assignee: resolvedAssignee,
    offset: 0,
    limit: 20,
    sort: sortParam,
    order: orderParam,
    search:
      typeof params.search === 'string' && params.search.length > 0
        ? params.search
        : undefined,
  });

  let initialAssigneeId: string;
  if (assigneeIdParam !== null) {
    initialAssigneeId = assigneeIdParam;
  } else if (currentUserId) {
    initialAssigneeId = String(currentUserId);
  } else {
    initialAssigneeId = '';
  }

  return (
    <Card className='h-full flex flex-col'>
      <PageHeader title='Tasktracker' />
      <div className='flex-1 overflow-hidden'>
        <TasktrackerTabs
          organizations={organizationsResponse.data ?? []}
          persons={persons}
          initialIssues={issues.data}
          initialTotalCount={issues.totalCount}
          initialColumns={groupedCards}
          initialFilters={{
            organization_id: orgId ?? '',
            team_id: typeof params.team_id === 'string' ? params.team_id : '',
            search: typeof params.search === 'string' ? params.search : '',
            type: typeParam,
            assignee_id: initialAssigneeId,
            priority: priorityParam,
            status: statusParam,
          }}
          initialSort={sortParam}
          initialOrder={orderParam}
        />
      </div>
    </Card>
  );
}
