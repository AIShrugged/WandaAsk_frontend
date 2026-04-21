import {
  getIssues,
  getPersons,
  isIssueStatus,
  isIssueType,
  type IssueSortField,
  type SortOrder,
} from '@/features/issues';
import { IssuesListTab } from '@/features/issues/ui/issues-list-tab';
import { getCurrentUserId } from '@/shared/lib/getCurrentUserId';
import { getOrganizationId } from '@/shared/lib/getOrganizationId';

export const metadata = { title: 'Tasktracker' };

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

/**
 * Issues list tab page — fetches initial issues for SSR.
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
      : 'created_at';
  const orderParam =
    typeof params.order === 'string' && isSortOrder(params.order)
      ? params.order
      : 'desc';
  const typeParam =
    typeof params.type === 'string' && isIssueType(params.type)
      ? params.type
      : '';
  let assigneeIdParam: string | null;
  if (!('assignee_id' in params)) {
    assigneeIdParam = null;
  } else if (typeof params.assignee_id === 'string') {
    assigneeIdParam = params.assignee_id;
  } else {
    assigneeIdParam = '';
  }

  const [persons, currentUserId] = await Promise.all([
    getPersons(),
    getCurrentUserId(),
  ]);

  const isUnassigned = assigneeIdParam === 'unassigned';
  let resolvedAssignee: number | null;
  if (assigneeIdParam === null) {
    resolvedAssignee = currentUserId ?? null;
  } else if (assigneeIdParam.length > 0 && !isUnassigned) {
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
    unassigned: isUnassigned,
    offset: 0,
    limit: 20,
    sort: sortParam,
    order: orderParam,
    search:
      typeof params.search === 'string' && params.search.length > 0
        ? params.search
        : undefined,
  });

  return (
    <IssuesListTab
      initialIssues={issues.data}
      initialTotalCount={issues.totalCount}
      persons={persons}
    />
  );
}
