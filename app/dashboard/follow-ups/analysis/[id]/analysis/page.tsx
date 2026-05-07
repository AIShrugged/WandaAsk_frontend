import { redirect } from 'next/navigation';

import { FollowUpAnalysis } from '@/features/follow-up';
import { getTeamFollowUp } from '@/features/teams';
import { ROUTES } from '@/shared/lib/routes';

/**
 * Follow-up analysis — Follow-up (analysis) tab.
 */
export default async function FollowUpAnalysisTabPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: followUp } = await getTeamFollowUp(id);

  if (!followUp?.calendar_event) {
    redirect(ROUTES.DASHBOARD.FOLLOWUPS);
  }

  const hasStaticArtifacts =
    followUp.text != null &&
    Object.keys(followUp.text.artifacts ?? {}).length > 0;

  return (
    <FollowUpAnalysis
      staticArtifacts={hasStaticArtifacts ? followUp.text : null}
    />
  );
}
