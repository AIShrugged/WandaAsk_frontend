import { redirect } from 'next/navigation';

import { ROUTES } from '@/shared/lib/routes';

/**
 * DashboardPage component.
 * @returns JSX element.
 */
export default async function DashboardPage() {
  redirect(`${ROUTES.DASHBOARD.TODAY_MEETINGS}`);
}
