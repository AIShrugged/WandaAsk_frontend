'use client';

import { useCallback } from 'react';

import { loadTeamsChunk } from '@/features/teams/api/team';
import { useTeamsStore } from '@/features/teams/model/teams-store';
import { useCachedInfiniteScroll } from '@/shared/hooks/use-cached-infinite-scroll';
import { TeamItem } from '@/features/teams/ui/team-item';
import { InfiniteScrollStatus } from '@/shared/ui/layout/infinite-scroll-status';
import SpinLoader from '@/shared/ui/layout/spin-loader';

import type { TeamActionType, TeamProps } from '@/entities/team';

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
  const fetchChunk = useCallback(
    async (offset: number, limit: number) => {
      const { data, hasMore } = await loadTeamsChunk(
        organizationId,
        offset,
        limit,
      );
      return { data: data as TeamProps[], hasMore };
    },
    [organizationId],
  );

  const { items, isLoading, hasMore, sentinelRef } =
    useCachedInfiniteScroll<TeamProps>({
      store: useTeamsStore,
      fetchChunk,
      cacheKey: organizationId,
      initialItems: initialTeams,
      totalCount,
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
