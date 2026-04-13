import { redirect } from 'next/navigation';

import { ROUTES } from '@/shared/lib/routes';

/**
 * Meeting detail root — redirects to the overview tab.
 */
export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  redirect(ROUTES.DASHBOARD.MEETING_DETAIL_OVERVIEW(id));
}
