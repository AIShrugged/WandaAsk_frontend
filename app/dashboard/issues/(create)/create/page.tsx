import { getEpics, getPersons, IssueForm } from '@/features/issues';
import { getOrganizations } from '@/features/organization';
import { getUser } from '@/features/user';
import { getOrganizationId } from '@/shared/lib/getOrganizationId';
import { Card, CardBody } from '@/shared/ui/card';
import PageHeader from '@/widgets/layout/ui/page-header';

export default async function IssueCreatePage() {
  const [organizationsResponse, persons, epics, organizationId, userResponse] =
    await Promise.all([
      getOrganizations(),
      getPersons(),
      getEpics().catch(() => {
        return [];
      }),
      getOrganizationId(),
      getUser(),
    ]);

  return (
    <Card className='h-full flex flex-col'>
      <PageHeader hasButtonBack title='Create task' />
      <div className='h-full overflow-y-auto'>
        <CardBody>
          <IssueForm
            organizations={organizationsResponse.data ?? []}
            persons={persons}
            epics={epics}
            defaultOrganizationId={organizationId}
            currentUser={userResponse.data ?? null}
          />
        </CardBody>
      </div>
    </Card>
  );
}
