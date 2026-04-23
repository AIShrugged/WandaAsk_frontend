import { getPersons, IssueForm } from '@/features/issues';
import { getOrganizations } from '@/features/organization';
import { getUser } from '@/features/user';
import { getOrganizationId } from '@/shared/lib/getOrganizationId';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import PageHeader from '@/widgets/layout/ui/page-header';

/**
 * IssueCreatePage component.
 * @returns JSX element.
 */
export default async function IssueCreatePage() {
  const [organizationsResponse, persons, organizationId, userResponse] =
    await Promise.all([
      getOrganizations(),
      getPersons(),
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
            defaultOrganizationId={organizationId}
            currentUser={userResponse.data ?? null}
          />
          <p className='mt-4 text-sm text-muted-foreground'>
            You can add attachments after saving the task.
          </p>
        </CardBody>
      </div>
    </Card>
  );
}
