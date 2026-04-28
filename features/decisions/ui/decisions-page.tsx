'use client';

import { Plus, Search } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { getDecisions } from '@/features/decisions/api/decisions';
import { AddDecisionModal } from '@/features/decisions/ui/add-decision-modal';
import { DecisionCard } from '@/features/decisions/ui/decision-card';
import { BUTTON_VARIANT } from '@/shared/types/button';
import { Button } from '@/shared/ui/button/Button';
import { Skeleton } from '@/shared/ui/layout/skeleton';

import type {
  Decision,
  DecisionFilters,
  DecisionSourceType,
} from '@/features/decisions/model/types';

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
  const [totalCount, setTotalCount] = useState(0);
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
      const result = await getDecisions(teamId, filters, 0, PAGE_SIZE);
      setDecisions(result.data ?? []);
      setTotalCount(result.totalCount);
    } catch {
      toast.error('Failed to load decisions');
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

  const hasMore = decisions.length < totalCount;

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return;

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
    hasMore,
    isLoadingMore,
    debouncedSearch,
    sourceTypeFilter,
  ]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { rootMargin: '40px' },
    );

    observer.observe(el);

    return () => {
      return observer.disconnect();
    };
  }, [hasMore, isLoadingMore, loadMore]);

  return (
    <div className='flex flex-col gap-4'>
      {/* Toolbar */}
      <div className='flex items-center gap-3 flex-wrap'>
        <div className='relative flex-1 min-w-48'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none' />
          <input
            type='text'
            placeholder='Search decisions…'
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

      {/* Content */}
      {isLoading && (
        <div className='flex flex-col gap-3'>
          {Array.from({ length: 5 }).map((_, i) => {
            return (
              <Skeleton key={i} className='h-24 rounded-[var(--radius-card)]' />
            );
          })}
        </div>
      )}

      {!isLoading && decisions.length === 0 && (
        <p className='text-muted-foreground text-sm text-center py-16'>
          {debouncedSearch
            ? `No decisions found for "${debouncedSearch}"`
            : 'No decisions yet. Add the first one!'}
        </p>
      )}

      {!isLoading && decisions.length > 0 && (
        <div className='flex flex-col gap-3'>
          {decisions.map((d) => {
            return <DecisionCard key={d.id} decision={d} />;
          })}
          <div ref={sentinelRef} />
          {isLoadingMore && (
            <div className='flex justify-center py-4'>
              <Skeleton className='h-8 w-32 rounded' />
            </div>
          )}
          {!hasMore && decisions.length > 0 && (
            <p className='text-center text-xs text-muted-foreground py-2'>
              {decisions.length} decision{decisions.length === 1 ? '' : 's'}{' '}
              total
            </p>
          )}
        </div>
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
