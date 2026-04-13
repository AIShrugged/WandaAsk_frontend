import { redirect } from 'next/navigation';

import { ROUTES } from '@/shared/lib/routes';

export default function IssuesPage() {
  redirect(ROUTES.DASHBOARD.KANBAN);
}
