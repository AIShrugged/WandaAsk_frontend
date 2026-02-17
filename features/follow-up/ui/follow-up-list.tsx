import { FollowUpItem } from '@/features/follow-up/ui/follow-up-item';

import type { TeamFollowUpDTO } from '@/entities/team';

export function FollowUpList({ followUps }: { followUps: TeamFollowUpDTO[] }) {
  return (
    <>
      {followUps.map(followUp => (
        <FollowUpItem key={followUp.id} followUp={followUp} />
      ))}
    </>
  );
}
