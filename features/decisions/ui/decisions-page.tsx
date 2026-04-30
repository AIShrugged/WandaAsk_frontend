'use client';

import { Plus, Search } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { getDecisions } from '@/features/decisions/api/decisions';
import { getKeyPoints } from '@/features/decisions/api/key-points';
import { AddDecisionModal } from '@/features/decisions/ui/add-decision-modal';
import { DecisionsTable } from '@/features/decisions/ui/decisions-table';
import { KeyPointsTable } from '@/features/decisions/ui/key-points-table';
import { BUTTON_VARIANT } from '@/shared/types/button';
import { Button } from '@/shared/ui/button/Button';
import { Skeleton } from '@/shared/ui/layout/skeleton';

import type { Decision, DecisionFilters, DecisionSourceType, MeetingKeyPoint } from '@/features/decisions/model/types';

const PAGE_SIZE = 20;

interface Props {
  teamId: number;
  sourceTypeFilter?: DecisionSourceType | null;
}

export function DecisionsPage({ teamId, sourceTypeFilter }: Props) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [totalDecisions, setTotalDecisions] = useState(0);

  const [keyPoints, setKeyPoints] = useState<MeetingKeyPoint[]>([]);
  const [totalKeyPoints, setTotalKeyPoints] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, startLoadingMore] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const filters: DecisionFilters = {
    source_type: sourceTypeFilter ?? null,
    search: debouncedSearch || null,
  };

  const loadInitial = useCallback(async () => {
    setIsLoading(true);
    try {
      const [decisionsResult, keyPointsResult] = await Promise.all([
        getDecisions(teamId, filters, 0, PAGE_SIZE),
        getKeyPoints(teamId, debouncedSearch || null, 0, PAGE_SIZE),
      ]);
      setDecisions(decisionsResult.data ?? []);
      setTotalDecisions(decisionsResult.totalCount);
      setKeyPoints(keyPointsResult.data ?? []);
      setTotalKeyPoints(keyPointsResult.totalCount);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [teamId, debouncedSearch, sourceTypeFilter]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => {
      return clearTimeout(timer);
    };
  }, [search]);

  const hasMoreDecisions = decisions.length < totalDecisions;

  const loadMore = useCallback(() => {
    if (!hasMoreDecisions || isLoadingMore) return;

    startLoadingMore(async () => {
      try {
        const result = await getDecisions(
          teamId,
          filters,
          decisions.length,
          PAGE_SIZE,
        );
        setDecisions((prev) => {
          return [...prev, ...(result.data ?? [])];
        });
      } catch {
        toast.error('Failed to load more decisions');
      }
    });
  }, [
    teamId,
    decisions.length,
    hasMoreDecisions,
    isLoadingMore,
    debouncedSearch,
    sourceTypeFilter,
  ]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMoreDecisions && !isLoadingMore) {
          loadMore();
        }
      },
      { rootMargin: '40px' },
    );

    observer.observe(el);

    return () => {
      return observer.disconnect();
    };
  }, [hasMoreDecisions, isLoadingMore, loadMore]);

  const isEmpty = decisions.length === 0 && keyPoints.length === 0;

  return (
    <div className='flex flex-col gap-6'>
      {/* Toolbar */}
      <div className='flex items-center gap-3 flex-wrap'>
        <div className='relative flex-1 min-w-48'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none' />
          <input
            type='text'
            placeholder='Search decisions and key points…'
            value={search}
            onChange={(e) => {
              return setSearch(e.target.value);
            }}
            className='h-10 w-full rounded-[var(--radius-button)] border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary'
          />
        </div>
        <Button
          variant={BUTTON_VARIANT.primary}
          onClick={() => {
            return setIsModalOpen(true);
          }}
          className='flex items-center gap-1.5'
        >
          <Plus className='w-4 h-4' />
          Add decision
        </Button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className='flex flex-col gap-3'>
          {Array.from({ length: 6 }).map((_, i) => {
            return (
              <Skeleton key={i} className='h-10 rounded-[var(--radius-card)]' />
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && isEmpty && (
        <p className='text-muted-foreground text-sm text-center py-16'>
          {debouncedSearch
            ? `Nothing found for "${debouncedSearch}"`
            : 'No decisions or key points yet.'}
        </p>
      )}

      {/* Key Points section */}
      {!isLoading && keyPoints.length > 0 && (
        <section className='flex flex-col gap-3'>
          <div className='flex items-center justify-between'>
            <h3 className='text-sm font-semibold text-foreground'>Key Points</h3>
            <span className='text-xs text-muted-foreground'>{totalKeyPoints} total</span>
          </div>
          <KeyPointsTable keyPoints={keyPoints} />
        </section>
      )}

      {/* Decisions section */}
      {!isLoading && decisions.length > 0 && (
        <section className='flex flex-col gap-3'>
          <div className='flex items-center justify-between'>
            <h3 className='text-sm font-semibold text-foreground'>Decisions</h3>
            <span className='text-xs text-muted-foreground'>{totalDecisions} total</span>
          </div>
          <DecisionsTable decisions={decisions} />
          <div ref={sentinelRef} />
          {isLoadingMore && (
            <div className='flex justify-center py-4'>
              <Skeleton className='h-8 w-32 rounded' />
            </div>
          )}
        </section>
      )}

      <AddDecisionModal
        teamId={teamId}
        isOpen={isModalOpen}
        onClose={() => {
          return setIsModalOpen(false);
        }}
        onCreated={() => {
          return void loadInitial();
        }}
      />
    </div>
  );
}
