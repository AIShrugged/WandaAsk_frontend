import { redirect } from 'next/navigation';

import { ROUTES } from '@/shared/lib/routes';

/**
 * Legacy meeting route redirect.
 * @param params - Route params.
 */
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  redirect(`${ROUTES.DASHBOARD.MEETINGS}/${id}`);
}
