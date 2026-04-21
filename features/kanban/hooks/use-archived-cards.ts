'use client';

import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';

import { fetchArchivedKanbanCards } from '@/features/kanban/api/kanban';

import type {
  IssueStatus,
  KanbanCard,
  KanbanFilters,
  SharedFilters,
} from '@/features/kanban/model/types';

function buildKanbanFilters(filters: SharedFilters): KanbanFilters {
  return {
    organization_id: filters.organization_id
      ? Number(filters.organization_id)
      : null,
    team_id: filters.team_id ? Number(filters.team_id) : null,
    type: filters.type || undefined,
    assignee_id: filters.assignee_id ? Number(filters.assignee_id) : null,
    search: filters.search || undefined,
  };
}

interface UseArchivedCardsResult {
  archivedDoneCards: KanbanCard[];
  archivedDoneCount: number | null;
  archivedDoneLoading: boolean;
  setArchivedDoneCards: Dispatch<SetStateAction<KanbanCard[]>>;
  setArchivedDoneCount: Dispatch<SetStateAction<number | null>>;
}

export function useArchivedCards(
  filters: SharedFilters,
  showArchived: boolean,
  columns: Record<IssueStatus, KanbanCard[]>,
): UseArchivedCardsResult {
  const [archivedDoneCards, setArchivedDoneCards] = useState<KanbanCard[]>([]);
  const [archivedDoneCount, setArchivedDoneCount] = useState<number | null>(
    null,
  );
  const [archivedDoneLoading, setArchivedDoneLoading] = useState(false);

  // Fetch count on filter/data change (for the toggle badge)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setArchivedDoneCount(null);
    const kanbanFilters = buildKanbanFilters(filters);
    let cancelled = false;

    fetchArchivedKanbanCards(kanbanFilters)
      .then((result) => {
        if (cancelled) return;
        if (!result.error && result.data) {
          setArchivedDoneCount(result.data.length);
          if (showArchived) {
            setArchivedDoneCards(result.data);
          }
        } else {
          setArchivedDoneCount(0);
        }
      })
      .catch(() => {
        if (!cancelled) setArchivedDoneCount(0);
      });

    return () => {
      cancelled = true;
    };
  }, [columns]);

  // Load/clear archived cards when toggle changes
  useEffect(() => {
    if (!showArchived) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setArchivedDoneCards([]);
      return;
    }

    setArchivedDoneLoading(true);
    const kanbanFilters = buildKanbanFilters(filters);

    fetchArchivedKanbanCards(kanbanFilters)
      .then((result) => {
        if (!result.error && result.data) {
          setArchivedDoneCards(result.data);
          setArchivedDoneCount(result.data.length);
        }
      })
      .catch(() => {
        // silently fail
      })
      .finally(() => {
        setArchivedDoneLoading(false);
      });
  }, [showArchived]);

  return {
    archivedDoneCards,
    archivedDoneCount,
    archivedDoneLoading,
    setArchivedDoneCards,
    setArchivedDoneCount,
  };
}
