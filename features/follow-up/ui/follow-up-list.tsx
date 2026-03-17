import { ListChecks } from 'lucide-react';
import React from 'react';

import { FollowUpItem } from '@/features/follow-up/ui/follow-up-item';
import { EmptyState } from '@/shared/ui/feedback/empty-state';

import type { TeamFollowUpDTO } from '@/entities/team';

/**
 * FollowUpList component.
 * @param props - Component props.
 * @param props.followUps
 * @returns JSX element.
 */
export function FollowUpList({ followUps }: { followUps: TeamFollowUpDTO[] }) {
  if (followUps.length === 0) {
    return (
      <EmptyState
        icon={ListChecks}
        title='No follow-ups yet'
        description='Follow-ups will appear here after meetings'
      />
    );
  }

  return (
    <>
      {followUps.map((followUp) => {
        return <FollowUpItem key={followUp.id} followUp={followUp} />;
      })}
    </>
  );
}
