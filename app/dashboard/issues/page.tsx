import { redirect } from 'next/navigation';

import { ROUTES } from '@/shared/lib/routes';

/**
 * Redirects to the default issues tab (list).
 */
export default function IssuesPage() {
  redirect(ROUTES.DASHBOARD.ISSUES_LIST);
}
