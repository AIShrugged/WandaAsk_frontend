import {
  getPersons,
  ISSUE_TYPE_OPTIONS,
  type IssueType,
} from '@/features/issues';
import { IssuesKanbanTab } from '@/features/issues/ui/issues-kanban-tab';
import { getKanbanIssues } from '@/features/kanban';
import { getOrganizations } from '@/features/organization/api/organization';
import { getOrganizationId } from '@/shared/lib/getOrganizationId';

import type { KanbanFilters } from '@/features/kanban/model/types';

export const metadata = { title: 'Kanban' };

function isIssueType(value: string): value is IssueType {
  return ISSUE_TYPE_OPTIONS.some((option) => {
    return option.value === value;
  });
}

/**
 * Kanban tab page — fetches initial kanban columns for SSR.
 */
export default async function IssuesKanbanPage({
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

  const typeParam =
    typeof params.type === 'string' && isIssueType(params.type)
      ? params.type
      : '';
  const assigneeIdParam =
    typeof params.assignee_id === 'string' ? params.assignee_id : null;

  const kanbanFilters: KanbanFilters = {
    organization_id: orgId ? Number(orgId) : null,
    team_id: params.team_id ? Number(params.team_id) : null,
    type: typeParam || undefined,
    assignee_id: assigneeIdParam ? Number(assigneeIdParam) : null,
    search: typeof params.search === 'string' ? params.search : undefined,
  };

  const [organizationsResponse, persons, groupedCards] = await Promise.all([
    getOrganizations(),
    getPersons(),
    getKanbanIssues(kanbanFilters),
  ]);

  return (
    <IssuesKanbanTab
      initialColumns={groupedCards}
      organizations={organizationsResponse.data ?? []}
      persons={persons}
    />
  );
}
