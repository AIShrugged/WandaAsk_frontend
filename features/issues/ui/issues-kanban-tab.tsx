'use client';

import { useEffect, useRef, useState } from 'react';

import { useFiltersContext } from '@/features/issues/model/filters-context';
import { KanbanBoard, fetchKanbanIssues } from '@/features/kanban';

import type { OrganizationProps } from '@/entities/organization';
import type { PersonOption } from '@/features/issues/model/types';
import type { KanbanIssuesResult } from '@/features/kanban/api/kanban';
import type { IssueStatus, KanbanCard } from '@/features/kanban/model/types';

interface IssuesKanbanTabProps {
  initialResult: KanbanIssuesResult;
  organizations: OrganizationProps[];
  persons: PersonOption[];
}

const EMPTY_COLUMNS: Record<IssueStatus, KanbanCard[]> = {
  open: [],
  in_progress: [],
  paused: [],
  review: [],
  reopen: [],
  done: [],
};

/**
 * IssuesKanbanTab — client wrapper that reads filter context and renders KanbanBoard.
 * Refetches kanban data client-side when filters change.
 */
export function IssuesKanbanTab({
  initialResult,
  organizations,
  persons,
}: IssuesKanbanTabProps) {
  const { filters, columnsVersion, setShowArchived } = useFiltersContext();
  const [columns, setColumns] = useState<Record<IssueStatus, KanbanCard[]>>(
    initialResult.columns,
  );
  const [isTruncated, setIsTruncated] = useState(initialResult.isTruncated);
  // Skip the first render only when SSR already provided data (full-page load).
  // On tab navigation initialColumns is empty, so we fetch immediately.
  const hasInitialData = Object.values(initialResult.columns).some((col) => {
    return col.length > 0;
  });
  const isFirstRender = useRef(hasInitialData);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    let cancelled = false;

    const run = async () => {
      const result = await fetchKanbanIssues({
        organization_id: filters.organization_id
          ? Number(filters.organization_id)
          : null,
        team_id: filters.team_id ? Number(filters.team_id) : null,
        type: filters.type || undefined,
        assignee_id:
          filters.assignee_id && filters.assignee_id !== 'unassigned'
            ? Number(filters.assignee_id)
            : null,
        unassigned: filters.assignee_id === 'unassigned',
        search: filters.search || undefined,
      });

      if (cancelled) return;

      if (!result.error && result.data) {
        setColumns(result.data.columns);
        setIsTruncated(result.data.isTruncated);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [
    filters.organization_id,
    filters.team_id,
    filters.type,
    filters.assignee_id,
    filters.search,
    columnsVersion,
  ]);

  return (
    <>
      {isTruncated && (
        <div className='mx-2 mb-2 rounded-[var(--radius-card)] border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-400'>
          Some issues are not shown — there are more than 500 open issues. Use
          filters to narrow the view.
        </div>
      )}
      <KanbanBoard
        columns={columns}
        organizations={organizations}
        persons={persons}
        filters={filters}
        onShowArchivedChange={setShowArchived}
      />
    </>
  );
}
