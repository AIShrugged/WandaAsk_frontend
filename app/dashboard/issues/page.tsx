import { getPersons, getIssues } from '@/features/issues';
import { isIssueStatus } from '@/features/issues/model/types';
import { IssuesPage } from '@/features/issues/ui/issues-page';
import { getOrganizations } from '@/features/organization/api/organization';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import PageHeader from '@/widgets/layout/ui/page-header';

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

  const page = Math.max(1, Number(params.page ?? '1') || 1);

  const pageSize = Math.max(1, Number(params.pageSize ?? '10') || 10);

  const offset = (page - 1) * pageSize;

  const statusParam =
    typeof params.status === 'string' && isIssueStatus(params.status)
      ? params.status
      : '';

  const [issues, organizationsResponse, persons] = await Promise.all([
    getIssues({
      organization_id: params.organization_id
        ? Number(params.organization_id)
        : null,
      team_id: params.team_id ? Number(params.team_id) : null,
      status: statusParam,
      type: typeof params.type === 'string' ? params.type : '',
      assignee: params.assignee ? Number(params.assignee) : null,
      offset,
      limit: pageSize,
    }),
    getOrganizations(),
    getPersons(),
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
            initialFilters={{
              organization_id:
                typeof params.organization_id === 'string'
                  ? params.organization_id
                  : '',
              team_id: typeof params.team_id === 'string' ? params.team_id : '',
              status: statusParam,
              type: typeof params.type === 'string' ? params.type : '',
              assignee:
                typeof params.assignee === 'string' ? params.assignee : '',
              page,
              pageSize,
              sort:
                typeof params.sort === 'string'
                  ? (params.sort as
                      | 'updated_desc'
                      | 'updated_asc'
                      | 'created_desc'
                      | 'created_asc'
                      | 'name_asc'
                      | 'name_desc'
                      | 'status_asc'
                      | 'status_desc')
                  : 'updated_desc',
            }}
          />
        </CardBody>
      </div>
    </Card>
  );
}
