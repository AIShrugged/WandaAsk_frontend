'use client';

import { Plus, Search } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { getDecisions } from '@/features/decisions/api/decisions';
import { AddDecisionModal } from '@/features/decisions/ui/add-decision-modal';
import { DecisionCard } from '@/features/decisions/ui/decision-card';
import { BUTTON_VARIANT } from '@/shared/types/button';
import { Button } from '@/shared/ui/button/Button';
import Input from '@/shared/ui/input/Input';
import InputDropdown from '@/shared/ui/input/InputDropdown';
import { Skeleton } from '@/shared/ui/layout/skeleton';

import type { TeamProps } from '@/entities/team';
import type {
  Decision,
  DecisionFilters,
  DecisionSourceType,
} from '@/features/decisions/model/types';

const PAGE_SIZE = 20;

interface Props {
  teams: TeamProps[];
  sourceTypeFilter?: DecisionSourceType | null;
}

export function DecisionsPage({ teams, sourceTypeFilter }: Props) {
  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    teams.length > 0 ? String(teams[0].id) : '',
  );
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, startLoadingMore] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const teamId = selectedTeamId ? Number(selectedTeamId) : null;

  const filters: DecisionFilters = {
    source_type: sourceTypeFilter ?? null,
    search: debouncedSearch || null,
  };

  const loadInitial = useCallback(async () => {
    if (!teamId) return;

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

  const handleSearchChange = (value: string) => {
    setSearch(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
    }, 400);
  };

  const hasMore = decisions.length < totalCount;

  const loadMore = useCallback(() => {
    if (!teamId || !hasMore || isLoadingMore) return;

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

  const teamOptions = teams.map((t) => {
    return { value: String(t.id), label: t.name };
  });

  return (
    <div className='flex flex-col gap-4'>
      {/* Toolbar */}
      <div className='flex items-center gap-3 flex-wrap'>
        {teams.length > 1 && (
          <InputDropdown
            options={teamOptions}
            value={selectedTeamId}
            onChange={(v) => {
              return setSelectedTeamId(v as string);
            }}
            placeholder='Select team'
            className='w-48'
          />
        )}
        <div className='relative flex-1 min-w-48'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none' />
          <Input
            value={search}
            onChange={(e) => {
              return handleSearchChange(e.target.value);
            }}
            placeholder='Search decisions…'
            className='pl-9'
          />
        </div>
        {teamId && (
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
        )}
      </div>

      {/* Content */}
      {!teamId && (
        <p className='text-sm text-muted-foreground text-center py-12'>
          No teams available. Join or create a team to view decisions.
        </p>
      )}

      {teamId && isLoading && (
        <div className='flex flex-col gap-3'>
          {Array.from({ length: 5 }).map((_, i) => {
            return (
              <Skeleton key={i} className='h-24 rounded-[var(--radius-card)]' />
            );
          })}
        </div>
      )}

      {teamId && !isLoading && decisions.length === 0 && (
        <div className='flex flex-col items-center justify-center py-16 gap-3 text-center'>
          <p className='text-muted-foreground text-sm'>
            {debouncedSearch
              ? `No decisions found for "${debouncedSearch}"`
              : 'No decisions yet. Add the first one!'}
          </p>
          <Button
            variant={BUTTON_VARIANT.primary}
            onClick={() => {
              return setIsModalOpen(true);
            }}
          >
            <Plus className='w-4 h-4' />
            Add decision
          </Button>
        </div>
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

      {teamId && (
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
      )}
    </div>
  );
}
