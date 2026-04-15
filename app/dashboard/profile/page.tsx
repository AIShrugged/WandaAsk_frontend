import { redirect } from 'next/navigation';

import { ROUTES } from '@/shared/lib/routes';

/**
 * Redirects to the default profile tab (Account Info).
 */
export default function ProfilePage() {
  redirect(ROUTES.DASHBOARD.PROFILE_ACCOUNT);
}
