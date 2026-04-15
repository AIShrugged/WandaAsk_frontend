import { redirect } from 'next/navigation';

import { ROUTES } from '@/shared/lib/routes';

export const dynamic = 'force-dynamic';

export default function TodayPage() {
  redirect(ROUTES.DASHBOARD.TODAY_MEETINGS);
}
