import { Users } from 'lucide-react';

import Card from '@/shared/ui/card/Card';

import type { TopParticipant } from '@/features/summary/types';

interface TopParticipantsBlockProps {
  participants: TopParticipant[];
}

/**
 * TopParticipantsBlock — leaderboard of most active meeting participants.
 * @param root0
 * @param root0.participants
 */
export function TopParticipantsBlock({
  participants,
}: TopParticipantsBlockProps) {
  const top = participants.slice(0, 8);

  const maxCount = top[0]?.meetings_count ?? 1;

  return (
    <Card className='flex flex-col gap-0'>
      <div className='flex items-center gap-2 px-5 py-4 border-b border-border'>
        <Users className='h-4 w-4 text-primary' />
        <h2 className='text-base font-semibold text-foreground'>
          Top Participants
        </h2>
      </div>
      <div className='px-5 py-4'>
        {top.length === 0 ? (
          <p className='text-sm text-muted-foreground text-center py-2'>
            No participant data available
          </p>
        ) : (
          <div className='flex flex-col gap-3'>
            {top.map((participant, index) => {
              const barWidth = Math.round(
                (participant.meetings_count / maxCount) * 100,
              );

              return (
                <div key={participant.name} className='flex items-center gap-3'>
                  <span className='text-xs text-muted-foreground w-4 shrink-0 tabular-nums'>
                    {index + 1}
                  </span>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center justify-between mb-1'>
                      <span className='text-sm text-foreground truncate'>
                        {participant.name}
                      </span>
                      <span className='text-xs text-muted-foreground tabular-nums ml-2 shrink-0'>
                        {participant.meetings_count}
                      </span>
                    </div>
                    <div className='h-1.5 rounded-full bg-muted overflow-hidden'>
                      <div
                        className='h-full rounded-full bg-primary/60'
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
