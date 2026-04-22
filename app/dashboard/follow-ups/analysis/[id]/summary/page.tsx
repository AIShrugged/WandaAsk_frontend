import { redirect } from 'next/navigation';

import { getTeamFollowUp } from '@/features/teams';
import { ROUTES } from '@/shared/lib/routes';
import EventOverview from '@/widgets/meeting/ui/event-overview';

/**
 * Follow-up analysis — Overview (summary) tab.
 */
export default async function FollowUpSummaryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: followUp } = await getTeamFollowUp(id);

  if (!followUp?.calendar_event) {
    redirect(ROUTES.DASHBOARD.FOLLOWUPS);
  }

  return (
    <EventOverview id={id} event={followUp.calendar_event} withoutMatcher />
  );
}
