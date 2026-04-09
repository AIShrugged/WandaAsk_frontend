import { redirect } from 'next/navigation';

import { ROUTES } from '@/shared/lib/routes';

/**
 * Calendar page — redirected to /dashboard/meetings/calendar
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; attached?: string }>;
}) {
  const params = await searchParams;

  const queryParts: string[] = [];
  if (params.month) queryParts.push(`month=${params.month}`);
  if (params.attached) queryParts.push(`attached=${params.attached}`);
  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

  redirect(`${ROUTES.DASHBOARD.MEETINGS_CALENDAR}${queryString}`);
}
