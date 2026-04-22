import { redirect } from 'next/navigation';

import { DeprecatedFollowUpModal, ExportButton } from '@/features/follow-up';
import { FollowUpTabsNav } from '@/features/meeting';
import { getTeamFollowUp } from '@/features/teams';
import { ROUTES } from '@/shared/lib/routes';
import Card from '@/shared/ui/card/Card';
import CardBody from '@/shared/ui/card/CardBody';
import PageHeader from '@/widgets/layout/ui/page-header';

/**
 * Follow-up analysis detail layout.
 * Renders the shared header, export button, deprecated modal, and tab strip.
 */
export default async function FollowUpAnalysisLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: followUp } = await getTeamFollowUp(id);

  if (!followUp?.calendar_event) {
    redirect(ROUTES.DASHBOARD.FOLLOWUPS);
  }

  return (
    <Card className='h-full flex flex-col overflow-y-scroll'>
      <div className='flex items-center justify-between pr-4'>
        <PageHeader hasButtonBack title={followUp.calendar_event.title} />
        <ExportButton followUpId={followUp.id} />
      </div>

      <CardBody>
        {followUp.is_deprecated && (
          <DeprecatedFollowUpModal followUpId={followUp.id} />
        )}

        <div>
          <FollowUpTabsNav />
        </div>

        <div className='mt-8'>{children}</div>
      </CardBody>
    </Card>
  );
}
