import { getPersons } from '@/features/issues';
import { getKanbanIssues, KanbanBoard } from '@/features/kanban';
import { getOrganizations } from '@/features/organization/api/organization';
import { getOrganizationId } from '@/shared/lib/getOrganizationId';
import Card from '@/shared/ui/card/Card';
import PageHeader from '@/widgets/layout/ui/page-header';

import type { SharedFilters } from '@/features/issues/model/types';
import type { KanbanFilters } from '@/features/kanban/model/types';

/**
 * KanbanPage — server component that loads data and renders the kanban board.
 * @param props - page props.
 * @param props.searchParams - URL search params.
 * @returns JSX element.
 */
export default async function KanbanPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const cookieOrgId = await getOrganizationId();
  const orgId = params.organization_id
    ? Number(params.organization_id)
    : Number(cookieOrgId);
  const kanbanFilters: KanbanFilters = {
    organization_id: orgId,
    team_id: params.team_id ? Number(params.team_id) : null,
    type: typeof params.type === 'string' ? params.type : undefined,
    assignee_id: params.assignee_id ? Number(params.assignee_id) : null,
    priority:
      typeof params.priority === 'string'
        ? (params.priority as KanbanFilters['priority'])
        : undefined,
  };
  const [groupedCards, organizationsResponse, persons] = await Promise.all([
    getKanbanIssues(kanbanFilters),
    getOrganizations(),
    getPersons(),
  ]);

  const filters: SharedFilters = {
    organization_id: String(orgId || ''),
    team_id: typeof params.team_id === 'string' ? params.team_id : '',
    search: typeof params.search === 'string' ? params.search : '',
    type: (typeof params.type === 'string'
      ? params.type
      : '') as SharedFilters['type'],
    assignee_id:
      typeof params.assignee_id === 'string' ? params.assignee_id : '',
    priority: (typeof params.priority === 'string'
      ? params.priority
      : '') as SharedFilters['priority'],
  };

  return (
    <Card className='h-full flex flex-col'>
      <PageHeader title='Kanban' />
      <div className='flex-1 overflow-hidden p-3'>
        <KanbanBoard
          initialColumns={groupedCards}
          organizations={organizationsResponse.data ?? []}
          persons={persons}
          filters={filters}
          columnsVersion={0}
        />
      </div>
    </Card>
  );
}
