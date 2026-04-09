import { redirect } from 'next/navigation';

import { ROUTES } from '@/shared/lib/routes';

/**
 * Page component.
 * @returns Redirect to summary page.
 */
export default function Page() {
  redirect(ROUTES.DASHBOARD.SUMMARY);
}
