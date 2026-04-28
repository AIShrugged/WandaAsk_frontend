import { redirect } from 'next/navigation';

import { ROUTES } from '@/shared/lib/routes';

export default function DecisionsPage() {
  redirect(ROUTES.DASHBOARD.DECISIONS_ALL);
}
