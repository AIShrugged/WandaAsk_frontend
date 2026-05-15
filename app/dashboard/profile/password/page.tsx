import { redirect } from 'next/navigation';

import { ROUTES } from '@/shared/lib/routes';

export default function ProfilePasswordPage() {
  redirect(ROUTES.DASHBOARD.PROFILE_ACCOUNT);
}
