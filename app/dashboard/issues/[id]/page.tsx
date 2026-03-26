import { notFound } from 'next/navigation';

import { getIssue, getIssueAttachments, getPersons } from '@/features/issues';
import { IssueAttachments } from '@/features/issues/ui/issue-attachments';
import { IssueForm } from '@/features/issues/ui/issue-form';
import { IssueOverviewPanel } from '@/features/issues/ui/issue-overview-panel';
import { getOrganizations } from '@/features/organization/api/organization';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import PageHeader from '@/widgets/layout/ui/page-header';

/**
 * IssueDetailPage component.
 * @param props - page props.
 * @param props.params - route params.
 * @returns JSX element.
 */
export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const issueId = Number(id);

  if (!Number.isFinite(issueId) || issueId <= 0) notFound();

  const [issue, attachments, organizationsResponse, persons] =
    await Promise.all([
      getIssue(issueId),
      getIssueAttachments(issueId).catch(() => {
        return [];
      }),
      getOrganizations(),
      getPersons(),
    ]);

  return (
    <div className='grid h-full gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]'>
      <Card className='h-full flex flex-col'>
        <PageHeader hasButtonBack title='Issue' />
        <div className='h-full overflow-y-auto'>
          <CardBody>
            <IssueForm
              issue={issue}
              organizations={organizationsResponse.data ?? []}
              persons={persons}
              hideStatusField
            />
          </CardBody>
        </div>
      </Card>

      <div className='flex h-full flex-col gap-6'>
        <IssueOverviewPanel issue={issue} />

        <Card className='h-full flex flex-col'>
          <PageHeader title='Attachments' />
          <div className='h-full overflow-y-auto'>
            <CardBody>
              <IssueAttachments
                issueId={issueId}
                initialAttachments={attachments}
              />
            </CardBody>
          </div>
        </Card>
      </div>
    </div>
  );
}
