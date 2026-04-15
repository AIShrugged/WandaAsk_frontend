import { redirect } from 'next/navigation';

import { ROUTES } from '@/shared/lib/routes';

import type { PageProps } from '@/shared/types/common';

/**
 * Backward-compat redirect: /dashboard/teams/[id] → /dashboard/teams?team_id=[id]
 * @param props - Component props.
 * @param props.params
 */
export default async function Page({ params }: PageProps) {
  const { id } = await params;

  redirect(`${ROUTES.DASHBOARD.TEAMS}?team_id=${id}`);
}
