import { redirect } from 'next/navigation';

import { ROUTES } from '@/shared/lib/routes';

/**
 * Redirects to the default (summary) tab.
 */
export default async function FollowUpAnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  redirect(`${ROUTES.DASHBOARD.FOLLOWUPS}/analysis/${id}/summary`);
}
