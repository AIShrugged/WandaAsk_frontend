'use client';

import { useCallback } from 'react';

import { loadTeamsChunk } from '@/app/actions/team';
import { TeamItem } from '@/features/teams/ui/team-item';
import { useInfiniteScroll } from '@/shared/hooks/use-infinite-scroll';
import { InfiniteScrollStatus } from '@/shared/ui/layout/infinite-scroll-status';
import SpinLoader from '@/shared/ui/layout/spin-loader';

import type { TeamActionType, TeamProps } from '@/features/teams/model/types';

const LIMIT = 10;

type Props = {
  initialTeams: TeamProps[];
  totalCount: number;
  organizationId: number | string;
  actions: TeamActionType[];
};

export function TeamList({
  initialTeams,
  totalCount,
  organizationId,
  actions,
}: Props) {
  const fetchMore = useCallback(
    async (offset: number) => {
      const { data, hasMore } = await loadTeamsChunk(
        organizationId,
        offset,
        LIMIT,
      );
      return { items: data as TeamProps[], hasMore };
    },
    [organizationId],
  );

  const { items, isLoading, hasMore, sentinelRef } =
    useInfiniteScroll<TeamProps>({
      fetchMore,
      initialItems: initialTeams,
      initialHasMore: initialTeams.length < totalCount,
    });

  if (!items) return null;

  return (
    <div className='flex flex-col h-full'>
      {items.map(team => (
        <TeamItem key={team.id} team={team} actions={actions} />
      ))}

      {!hasMore && items.length > 0 ? (
        <div className='py-4'>
          <InfiniteScrollStatus itemCount={items.length} />
        </div>
      ) : (
        <div ref={sentinelRef} className='h-10' />
      )}

      {isLoading && (
        <div className='flex justify-center py-4'>
          <SpinLoader />
        </div>
      )}
    </div>
  );
}
