'use client';

import { useEffect, useRef, useState } from 'react';

import { useFiltersContext } from '@/features/issues/model/filters-context';
import { fetchKanbanIssues, KanbanBoard } from '@/features/kanban';

import type { OrganizationProps } from '@/entities/organization';
import type { PersonOption } from '@/features/issues/model/types';
import type { IssueStatus, KanbanCard } from '@/features/kanban/model/types';

interface IssuesKanbanTabProps {
  initialColumns: Record<IssueStatus, KanbanCard[]>;
  organizations: OrganizationProps[];
  persons: PersonOption[];
}

/**
 * IssuesKanbanTab — client wrapper that reads filter context and renders KanbanBoard.
 * Refetches kanban data client-side when filters change.
 */
export function IssuesKanbanTab({
  initialColumns,
  organizations,
  persons,
}: IssuesKanbanTabProps) {
  const { filters, columnsVersion } = useFiltersContext();
  const [columns, setColumns] =
    useState<Record<IssueStatus, KanbanCard[]>>(initialColumns);
  const [isFetching, setIsFetching] = useState(false);
  const isFirstRender = useRef(true);

  // Refetch kanban data when filters change (skip initial render — SSR data is already correct)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    let cancelled = false;

    const run = async () => {
      setIsFetching(true);

      const result = await fetchKanbanIssues({
        organization_id: filters.organization_id
          ? Number(filters.organization_id)
          : null,
        team_id: filters.team_id ? Number(filters.team_id) : null,
        type: filters.type || undefined,
        assignee_id: filters.assignee_id ? Number(filters.assignee_id) : null,
        search: filters.search || undefined,
      });

      if (cancelled) return;

      if (!result.error && result.data) {
        setColumns(result.data);
      }

      setIsFetching(false);
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [columnsVersion]);

  return (
    <div className='p-3'>
      <KanbanBoard
        columns={columns}
        organizations={organizations}
        persons={persons}
        filters={filters}
        isFetching={isFetching}
      />
    </div>
  );
}
