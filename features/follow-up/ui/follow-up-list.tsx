import React from 'react';

import { FollowUpItem } from '@/features/follow-up/ui/follow-up-item';

import type { TeamFollowUpDTO } from '@/entities/team';

/**
 * FollowUpList component.
 * @param props - Component props.
 * @param props.followUps
 */
export function FollowUpList({ followUps }: { followUps: TeamFollowUpDTO[] }) {
  return (
    <>
      {followUps.map((followUp) => {
        return <FollowUpItem key={followUp.id} followUp={followUp} />;
      })}
    </>
  );
}
