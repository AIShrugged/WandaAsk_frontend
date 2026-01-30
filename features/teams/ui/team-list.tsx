'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

import { loadTeamsChunk } from '@/app/actions/team';
import { TeamItem } from '@/features/teams/ui/team-item';
import SpinLoader from '@/shared/ui/layout/spin-loader';

import type { TeamProps } from '@/features/teams/model/types';

const LIMIT = 10;

type Props = {
  initialTeams: TeamProps[];
  totalCount: number;
  organizationId: number | string;
};

export function TeamList({ initialTeams, totalCount, organizationId }: Props) {
  const [items, setItems] = useState<TeamProps[]>(initialTeams);
  const [offset, setOffset] = useState(initialTeams.length);
  const [hasMore, setHasMore] = useState(initialTeams.length < totalCount);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);

    try {
      const { data, hasMore: more } = await loadTeamsChunk(
        organizationId,
        offset,
        LIMIT,
      );

      setItems(prev => [...prev, ...data]);
      setOffset(prev => prev + data.length);
      setHasMore(more);
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, offset, isLoading, hasMore]);

  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isLoading) {
          void loadMore();
        }
      },
      { rootMargin: '20px' },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMore]);

  if (!items) return null;

  return (
    <div className='flex flex-col h-full'>
      {items.map(team => (
        <TeamItem key={team.id} team={team} />
      ))}

      {!hasMore && items.length > 0 ? (
        <div className='text-center text-gray-500 py-4'>
          Loaded: {items.length} items
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
