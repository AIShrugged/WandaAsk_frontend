import { ShieldX } from 'lucide-react';

import { EmptyState } from '@/shared/ui/feedback/empty-state';

/**
 *
 * @param root0
 * @param root0.title
 * @param root0.description
 */
export function AccessDeniedState({
  title = 'Access denied',
  description = 'Only organization managers can access agents, tasks, and runs for the active organization.',
}: {
  title?: string;
  description?: string;
}) {
  return <EmptyState icon={ShieldX} title={title} description={description} />;
}
