import { getPersons, getIssues } from '@/features/issues';
import {
  isIssueStatus,
  type IssuePriority,
} from '@/features/issues/model/types';
import { IssuesPage } from '@/features/issues/ui/issues-page';
import { getOrganizations } from '@/features/organization/api/organization';
import { getOrganizationId } from '@/shared/lib/getOrganizationId';
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
  const cookieOrgId = await getOrganizationId();
  const orgId =
    typeof params.organization_id === 'string'
      ? params.organization_id
      : cookieOrgId;
  const statusParam =
    typeof params.status === 'string' && isIssueStatus(params.status)
      ? params.status
      : '';
  const [issues, organizationsResponse, persons] = await Promise.all([
    getIssues({
      organization_id: orgId ? Number(orgId) : null,
      team_id: params.team_id ? Number(params.team_id) : null,
      status: statusParam,
      type: typeof params.type === 'string' ? params.type : '',
      assignee: params.assignee ? Number(params.assignee) : null,
      offset: 0,
      limit: 20,
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
              organization_id: orgId,
              team_id: typeof params.team_id === 'string' ? params.team_id : '',
              status: statusParam,
              type: typeof params.type === 'string' ? params.type : '',
              assignee:
                typeof params.assignee === 'string' ? params.assignee : '',
              priority:
                typeof params.priority === 'string'
                  ? (params.priority as IssuePriority)
                  : '',
            }}
          />
        </CardBody>
      </div>
    </Card>
  );
}
