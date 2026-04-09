'use client';

import { Users } from 'lucide-react';
import { useCallback } from 'react';

import { loadTeamsChunk } from '@/features/teams/api/team';
import { useTeamsStore } from '@/features/teams/model/teams-store';
import { TeamItem } from '@/features/teams/ui/team-item';
import { useCachedInfiniteScroll } from '@/shared/hooks/use-cached-infinite-scroll';
import { EmptyState } from '@/shared/ui/feedback/empty-state';
import { InfiniteScrollStatus } from '@/shared/ui/layout/infinite-scroll-status';
import SpinLoader from '@/shared/ui/layout/spin-loader';

import type { TeamActionType, TeamProps } from '@/entities/team';

type Props = {
  initialTeams: TeamProps[];
  totalCount: number;
  organizationId: number | string;
  actions: TeamActionType[];
  href: string;
};

/**
 * TeamList component.
 * @param root0
 * @param root0.initialTeams
 * @param root0.totalCount
 * @param root0.organizationId
 * @param root0.actions
 * @param root0.href
 * @returns JSX element.
 */
export function TeamList({
  initialTeams,
  totalCount,
  organizationId,
  actions,
  href,
}: Props) {
  const fetchChunkAction = useCallback(
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
      fetchChunkAction,
      cacheKey: organizationId,
      initialItems: initialTeams,
      totalCount,
    });

  if (!items) return null;

  if (items.length === 0 && !isLoading) {
    return (
      <EmptyState
        icon={Users}
        title='No teams yet'
        description='Create a team to get started'
      />
    );
  }

  return (
    <div className='flex flex-col h-full'>
      {items.map((team) => {
        return (
          <TeamItem href={href} key={team.id} team={team} actions={actions} />
        );
      })}

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
