import { redirect } from 'next/navigation';

/**
 * Calendar page — now redirected to /dashboard/meetings?tab=calendar
 * @param root0
 * @param root0.searchParams
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; attached?: string }>;
}) {
  const params = await searchParams;
  const monthParam = params.month ? `&month=${params.month}` : '';
  const attachedParam = params.attached ? `&attached=${params.attached}` : '';

  redirect(`/dashboard/meetings?tab=calendar${monthParam}${attachedParam}`);
}
