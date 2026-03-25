import { ListChecks } from 'lucide-react';

import { FollowUpItem } from '@/features/follow-up/ui/follow-up-item';
import { GenericList } from '@/shared/ui/layout/generic-list';

import type { TeamFollowUpDTO } from '@/entities/team';

/**
 * FollowUpList component.
 * @param props - Component props.
 * @param props.followUps
 * @returns JSX element.
 */
export function FollowUpList({ followUps }: { followUps: TeamFollowUpDTO[] }) {
  return (
    <GenericList
      items={followUps}
      keyExtractor={(f) => {
        return f.id;
      }}
      renderItem={(followUp) => {
        return <FollowUpItem followUp={followUp} />;
      }}
      emptyState={{
        icon: ListChecks,
        title: 'No follow-ups yet',
        description: 'Follow-ups will appear here after meetings',
      }}
    />
  );
}
