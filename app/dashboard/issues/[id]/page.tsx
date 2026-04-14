import { notFound } from 'next/navigation';

import {
  getIssue,
  getIssueAttachments,
  getPersons,
  IssueAttachments,
} from '@/features/issues';
import { IssueForm } from '@/features/issues/ui/issue-form';
import { IssueLinkedTask } from '@/features/issues/ui/issue-linked-task';
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
      getIssue(issueId).catch((error: Error) => {
        if (
          error.message.includes('404') ||
          error.message.toLowerCase().includes('not found') ||
          error.message.toLowerCase().includes('no query results')
        ) {
          notFound();
        }
        throw error;
      }),
      getIssueAttachments(issueId).catch(() => {
        return [];
      }),
      getOrganizations(),
      getPersons(),
    ]);

  return (
    <div className='h-full overflow-y-auto'>
      <div className='grid min-h-full gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]'>
        <div className='flex flex-col gap-6'>
          <Card className='flex flex-col'>
            <PageHeader hasButtonBack title='Task' />
            <div className='overflow-y-auto'>
              <CardBody>
                <IssueForm
                  issue={issue}
                  organizations={organizationsResponse.data ?? []}
                  persons={persons}
                />
              </CardBody>
            </div>
          </Card>
          <IssueLinkedTask issue={issue} />
        </div>

        <div className='flex h-full flex-col gap-6'>
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
    </div>
  );
}
