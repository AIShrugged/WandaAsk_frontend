import { getPersons } from '@/features/issues';
import { IssueForm } from '@/features/issues/ui/issue-form';
import { getOrganizations } from '@/features/organization/api/organization';
import { getOrganizationId } from '@/shared/lib/getOrganizationId';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import PageHeader from '@/widgets/layout/ui/page-header';

/**
 * IssueCreatePage component.
 * @returns JSX element.
 */
export default async function IssueCreatePage() {
  const [organizationsResponse, persons, organizationId] = await Promise.all([
    getOrganizations(),
    getPersons(),
    getOrganizationId(),
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
          />
        </CardBody>
      </div>
    </Card>
  );
}
