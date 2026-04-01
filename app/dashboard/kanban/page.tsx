import { redirect } from 'next/navigation';

import { ROUTES } from '@/shared/lib/routes';

/**
 * Legacy standalone kanban page — redirects to the kanban tab inside issues.
 */
export default function KanbanPage() {
  redirect(ROUTES.DASHBOARD.ISSUES_KANBAN);
}
