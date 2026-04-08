import { CheckSquare } from 'lucide-react';

import { EmptyState } from '@/shared/ui/feedback/empty-state';

/**
 * Follow-up analysis — Tasks tab.
 */
export default function FollowUpTasksPage() {
  return (
    <EmptyState
      icon={CheckSquare}
      title='Tasks'
      description='Tasks from this follow-up will appear here.'
    />
  );
}
