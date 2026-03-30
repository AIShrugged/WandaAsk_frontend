import { getPersons, getIssues } from '@/features/issues';
import {
  isIssueStatus,
  ISSUE_TYPE_OPTIONS,
  type IssuePriority,
  type IssueType,
  type IssueSortField,
  type SortOrder,
} from '@/features/issues/model/types';
import { IssuesPage } from '@/features/issues/ui/issues-page';
import { getOrganizations } from '@/features/organization/api/organization';
import { getCurrentUserId } from '@/shared/lib/getCurrentUserId';
import { getOrganizationId } from '@/shared/lib/getOrganizationId';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import PageHeader from '@/widgets/layout/ui/page-header';

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
  const [issues, organizationsResponse, persons, currentUserId] =
    await Promise.all([
      getIssues({
        organization_id: orgId ? Number(orgId) : null,
        team_id: params.team_id ? Number(params.team_id) : null,
        status: statusParam,
        type: typeParam,
        assignee: params.assignee ? Number(params.assignee) : null,
        offset: 0,
        limit: 20,
        sort: sortParam,
        order: orderParam,
        search:
          typeof params.search === 'string' && params.search.length > 0
            ? params.search
            : undefined,
      }),
      getOrganizations(),
      getPersons(),
      getCurrentUserId(),
    ]);

  return (
    <Card className='h-full flex flex-col'>
      <PageHeader title='Issues' />
      <div className='h-full overflow-y-auto'>
        <CardBody>
          <IssuesPage
            initialIssues={issues.data}
            initialTotalCount={issues.totalCount}
            organizations={organizationsResponse.data ?? []}
            persons={persons}
            currentUserId={currentUserId}
            initialFilters={{
              organization_id: orgId,
              team_id: typeof params.team_id === 'string' ? params.team_id : '',
              status: statusParam,
              type: typeParam,
              assignee:
                typeof params.assignee === 'string' ? params.assignee : '',
              priority:
                typeof params.priority === 'string'
                  ? (params.priority as IssuePriority)
                  : '',
              sort: sortParam,
              order: orderParam,
              search: typeof params.search === 'string' ? params.search : '',
            }}
          />
        </CardBody>
      </div>
    </Card>
  );
}
